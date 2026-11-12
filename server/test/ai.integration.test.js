import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import app from '../src/app.js';
import { analyzeComplaint } from '../src/services/aiAnalysisService.js';
import { createCsrfToken, signSessionToken } from '../src/utils/authTokens.js';

const expectedKeys = ['summary','suggestedDepartment','suggestedCategory','suggestedPriority','sufficientInformation','uncertainty'];

test('Phase 6 Groq analysis and Phase 1-5 regression checks', async (t) => {
  const connection=await pool.getConnection();let server;const userIds=[];const grievanceIds=[];let originalFetch;
  try {
    const [[district]]=await connection.execute('SELECT name FROM districts ORDER BY id LIMIT 1');
    const [[department]]=await connection.execute('SELECT id,name FROM departments ORDER BY id LIMIT 1');
    assert.ok(district&&department,'seeded reference data is available');
    const suffix=`ai-test-${Date.now()}`;const tempPasswordHash='test-only-no-login';
    async function addUser(role,departmentId=null){const [r]=await connection.execute('INSERT INTO users(name,email,mobile,password_hash,role,department_id,is_active) VALUES(?,?,?,?,?,?,TRUE)',[`AI integration ${role}`,`${suffix}-${userIds.length}@test.invalid`,'0000000000',tempPasswordHash,role,departmentId]);userIds.push(String(r.insertId));return String(r.insertId);}
    const citizenId=await addUser('citizen');const cmoId=await addUser('cmo_admin');const officerId=await addUser('department_officer',department.id);
    const [existing]=await connection.execute("INSERT INTO grievances(reference_number,citizen_id,district,category,subject,description,priority,status) VALUES(?,?,?,'Other Public Services',?,'A temporary complaint about a public service with insufficient details to identify its exact location.','Medium','Submitted')",[`CMK-2098-${Date.now().toString(16).toUpperCase().padStart(16,'0').slice(-16)}`,citizenId,district.name,'AI analysis privacy test']);
    const aiGrievanceId=String(existing.insertId);grievanceIds.push(aiGrievanceId);
    const temporaryGrievance=async()=>{
      const ref=`CMK-2098-${(Date.now()+1).toString(16).toUpperCase().padStart(16,'0').slice(-16)}`;
      const [r]=await connection.execute("INSERT INTO grievances(reference_number,citizen_id,district,category,subject,description,priority,status) VALUES(?,?,?,'Other Public Services',?,'The drainage outside the public library has overflowed for several days and needs inspection.','Medium','Submitted')",[ref,citizenId,district.name,'AI regression submission']);grievanceIds.push(String(r.insertId));
      await connection.execute("INSERT INTO grievance_history(grievance_id,previous_status,new_status,remarks,citizen_visible,changed_by) VALUES(?,NULL,'Submitted','Submitted for AI regression testing.',TRUE,?)",[r.insertId,citizenId]);return{ id:String(r.insertId), reference:ref };
    };
    server=app.listen(0,'127.0.0.1');await new Promise((resolve)=>server.once('listening',resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    const auth=(id,role)=>{const session=signSessionToken({id,role});const csrf=createCsrfToken(session);return{cookie:`${env.authCookieName}=${session}; ${env.csrfCookieName}=${csrf}`,'X-CSRF-Token':csrf};};
    const citizenAuth=auth(citizenId,'citizen'),cmoAuth=auth(cmoId,'cmo_admin'),officerAuth=auth(officerId,'department_officer');
    function request(path,{method='GET',headers={},body,authHeaders}={}){return new Promise((resolve,reject)=>{const url=new URL(path,base);const data=body===undefined?undefined:JSON.stringify(body);const req=http.request(url,{method,headers:{...(authHeaders?{Cookie:authHeaders.cookie,'X-CSRF-Token':authHeaders['X-CSRF-Token']}:{}),...(data?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}:{}),...headers}},res=>{let raw='';res.setEncoding('utf8');res.on('data',chunk=>raw+=chunk);res.on('end',()=>{let json;try{json=JSON.parse(raw)}catch{}resolve({status:res.statusCode,body:json});});});req.on('error',reject);if(data)req.write(data);req.end();});}
    const validAnalysis={summary:'Drainage overflow outside a public library has continued for several days.',suggestedDepartment:department.name,suggestedCategory:'Sanitation and Waste Management',suggestedPriority:'Medium',sufficientInformation:true,uncertainty:null};
    const response=(content,status=200)=>new Response(JSON.stringify(status===200?{choices:[{message:{content:JSON.stringify(content)}}]}:{error:{message:'provider response must not leak'}}),{status,headers:{'Content-Type':'application/json'}});

    await t.test('valid structured suggestions validate against database categories',async()=>{
      const result=await analyzeComplaint('The drainage outside the public library has overflowed for several days.',{config:{provider:'groq',apiKey:'unit-test-key',model:'openai/gpt-oss-20b'},departmentNames:[department.name],fetchImpl:async(url,options)=>{assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer unit-test-key');const sent=JSON.parse(options.body);assert.equal(sent.response_format.type,'json_schema');assert.match(sent.messages[0].content,/untrusted data/);assert.deepEqual(Object.keys(JSON.parse(sent.messages[1].content)),['complaint_description']);return response(validAnalysis);}});
      assert.deepEqual(Object.keys(result),expectedKeys);assert.equal(result.suggestedDepartment,department.name);
    });
    await t.test('invalid model enum and malformed JSON are rejected safely',async()=>{
      await assert.rejects(analyzeComplaint('A complaint description long enough to test the model result.',{config:{provider:'groq',apiKey:'unit-test-key',model:'test'},departmentNames:[department.name],fetchImpl:async()=>response({...validAnalysis,suggestedCategory:'Invented category'})}),e=>e.status===502&&!e.message.includes('Invented category'));
      await assert.rejects(analyzeComplaint('A complaint description long enough to test malformed output.',{config:{provider:'groq',apiKey:'unit-test-key',model:'test'},departmentNames:[department.name],fetchImpl:async()=>new Response(JSON.stringify({choices:[{message:{content:'not-json'}}]}),{status:200})}),e=>e.status===502);
    });
    await t.test('missing key, provider rate limit, and timeout are mapped to safe errors',async()=>{
      await assert.rejects(analyzeComplaint('A complaint description long enough for configuration testing.',{config:{provider:'groq',apiKey:'',model:'test'},departmentNames:[department.name],fetchImpl:async()=>{throw Error('should not call provider')}}),e=>e.status===503&&!e.message.includes('unit-test-key'));
      await assert.rejects(analyzeComplaint('A complaint description long enough for provider testing.',{config:{provider:'groq',apiKey:'unit-test-key',model:'test'},departmentNames:[department.name],fetchImpl:async()=>response(null,429)}),e=>e.status===503&&!e.message.includes('provider response'));
      await assert.rejects(analyzeComplaint('A complaint description long enough for timeout testing.',{config:{provider:'groq',apiKey:'unit-test-key',model:'test'},departmentNames:[department.name],fetchImpl:async()=>{const e=Error();e.name='AbortError';throw e;}}),e=>e.status===504);
    });
    await t.test('AI routes enforce roles, input limits, and do not mutate official grievance fields',async()=>{
      assert.equal((await request('/api/grievances/ai-analysis',{method:'POST',body:{description:'This is a sufficiently long public complaint description.'}})).status,403);
      assert.equal((await request('/api/grievances/ai-analysis',{method:'POST',authHeaders:cmoAuth,body:{description:'This is a sufficiently long public complaint description.'}})).status,403);
      assert.equal((await request('/api/grievances/ai-analysis',{method:'POST',authHeaders:{cookie:citizenAuth.cookie,'X-CSRF-Token':''},body:{description:'This is a sufficiently long public complaint description.'}})).status,403);
      assert.equal((await request('/api/grievances/ai-analysis',{method:'POST',authHeaders:citizenAuth,body:{description:'too short'}})).status,400);
      assert.equal((await request('/api/grievances/ai-analysis',{method:'POST',authHeaders:citizenAuth,body:{description:'A'.repeat(10001)}})).status,413);
      assert.equal((await request(`/api/cmo/grievances/${aiGrievanceId}/ai-analysis`,{method:'POST',authHeaders:citizenAuth})).status,403);
      const before=(await connection.execute('SELECT status,priority,assigned_department_id,assigned_officer_id FROM grievances WHERE id=?',[aiGrievanceId]))[0][0];
      originalFetch=globalThis.fetch;globalThis.fetch=async()=>response(validAnalysis);
      const citizenResult=await request('/api/grievances/ai-analysis',{method:'POST',authHeaders:citizenAuth,body:{description:'The drainage outside the public library has overflowed for several days.'}});
      assert.equal(citizenResult.status,200);assert.equal(citizenResult.body.data.aiGenerated,true);assert.equal(citizenResult.body.data.suggestedDepartment,department.name);
      const cmoResult=await request(`/api/cmo/grievances/${aiGrievanceId}/ai-analysis`,{method:'POST',authHeaders:cmoAuth});assert.equal(cmoResult.status,200);
      const after=(await connection.execute('SELECT status,priority,assigned_department_id,assigned_officer_id FROM grievances WHERE id=?',[aiGrievanceId]))[0][0];assert.deepEqual(after,before);
      assert.equal((await request('/api/cmo/grievances/999999999999999999/ai-analysis',{method:'POST',authHeaders:cmoAuth})).status,404);
    });
    await t.test('citizen, CMO assignment, officer access and tracking regressions pass',async()=>{
      const submitted=await request('/api/grievances',{method:'POST',authHeaders:citizenAuth,body:{district:district.name,category:'Other Public Services',subject:'AI regression submission',description:'The drainage outside the public library has overflowed for several days and needs inspection.'}});
      assert.equal(submitted.status,201);const grievanceId=submitted.body.data.id;grievanceIds.push(grievanceId);
      const cmoReview=await request(`/api/cmo/grievances/${grievanceId}/review`,{method:'POST',authHeaders:cmoAuth,body:{}});assert.equal(cmoReview.status,200);
      const assignment=await request(`/api/cmo/grievances/${grievanceId}/assign`,{method:'POST',authHeaders:cmoAuth,body:{departmentId:department.id,officerId,notes:'Temporary AI regression assignment.'}});assert.equal(assignment.status,200);
      assert.equal((await request('/api/officer/statistics',{authHeaders:officerAuth})).status,200);
      assert.equal((await request(`/api/officer/grievances/${grievanceId}`,{authHeaders:officerAuth})).status,200);
      assert.equal((await request(`/api/grievances/track/${submitted.body.data.reference_number}`)).status,200);
      assert.equal((await request('/api/departments')).status,200);
    });
  } finally {
    if(originalFetch)globalThis.fetch=originalFetch;
    if(server)await new Promise(resolve=>server.close(resolve));
    try{if(grievanceIds.length){const marks=grievanceIds.map(()=>'?').join(',');await connection.execute(`DELETE FROM grievance_history WHERE grievance_id IN (${marks})`,grievanceIds);await connection.execute(`DELETE FROM department_assignments WHERE grievance_id IN (${marks})`,grievanceIds);await connection.execute(`DELETE FROM grievances WHERE id IN (${marks})`,grievanceIds);}if(userIds.length)await connection.execute(`DELETE FROM users WHERE id IN (${userIds.map(()=>'?').join(',')})`,userIds);if(grievanceIds.length){const marks=grievanceIds.map(()=>'?').join(',');const [[remaining]]=await connection.execute(`SELECT COUNT(*) total FROM grievances WHERE id IN (${marks})`,grievanceIds);assert.equal(Number(remaining.total),0,'temporary test grievances were removed');}if(userIds.length){const marks=userIds.map(()=>'?').join(',');const [[remaining]]=await connection.execute(`SELECT COUNT(*) total FROM users WHERE id IN (${marks})`,userIds);assert.equal(Number(remaining.total),0,'temporary test users were removed');}}finally{connection.release();await pool.end();}
  }
});
