import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseCsv,summarize,reportMarkdown,run} from '../scripts/research-report.mjs';

const feedbackHeaders=['email','name','role','company_size','consent_at','consent_version','portal','operations','sync','ease','intent','price','liked','disliked','created'];
const eventHeaders=['email','action','created'];
const csv=(headers,rows)=>'\uFEFF'+[headers,...rows.map(r=>headers.map(h=>r[h]??''))].map(row=>row.map(s=>'"'+String(s).replaceAll('"','""')+'"').join(',')).join('\r\n');
const response=(overrides={})=>({email:'tester@sample.invalid',name:'Private test name',role:'operations',company_size:'10to30',consent_at:'2026-10-17T01:00:00.000Z',consent_version:'cp3-v1',portal:4,operations:5,sync:4,ease:3,intent:'maybe',price:0,liked:'Private comment',disliked:'A quoted "comment"\nwith newline',created:'2026-10-17T02:00:00.000Z',...overrides});
const flow=(email='tester@sample.invalid',created='2026-10-17T01:30:00.000Z')=>['tour_updated','portal_viewed','task_created','task_status_changed'].map(action=>({email,action,created}));
const summary=(responses,events=flow())=>summarize(csv(feedbackHeaders,responses),csv(eventHeaders,events));

test('CSV preserves quoted multiline fields and refuses malformed/truncated data',()=>{
 const parsed=parseCsv(csv(feedbackHeaders,[response()]));
 assert.equal(parsed.rows[0].disliked,response().disliked);
 assert.throws(()=>parseCsv('email,created\n"unterminated'),/dấu nháy/);
 assert.throws(()=>parseCsv('email,created\na,b,c'),/số cột/);
 assert.throws(()=>parseCsv('email,email\na,b'),/trùng/);
 assert.throws(()=>parseCsv('email\n"a"bad'),/ký tự thừa/);
});
test('empty export produces null statistics and never invents a price or decision',()=>{
 const s=summarize('\uFEFFNo data\r\n','\uFEFFNo data\r\n');
 assert.equal(s.validResponses,0);assert.equal(s.matchedResponses,0);
 assert.equal(s.scores.portal.mean,null);assert.equal(s.willingnessToPay.median,null);
 assert.equal(s.minimum20Records,false);assert.equal(s.independentPeopleVerified,false);
 assert.match(reportMarkdown(s),/CHƯA CÓ DỮ LIỆU/);
});
test('test/system accounts are excluded and email normalization prevents duplicate counts',()=>{
 const s=summary([response(),response({email:' TESTER@SAMPLE.INVALID ',portal:1,created:'2026-10-17T03:00:00.000Z'}),response({email:'ui-qa@example.test'}),response({email:'reviewer@sample.invalid',role:'reviewer'})]);
 assert.equal(s.matchedResponses,1);assert.equal(s.scores.portal.mean,1);
 assert.deepEqual(s.excluded,{invalid:0,qa:1,system:1,duplicateEmail:1});
 assert.equal(s.incompleteFlow,0);
});
test('only actions after consent and before saved feedback qualify the log-matched subset',()=>{
 for(const created of ['2026-10-17T00:30:00.000Z','2026-10-17T02:30:00.000Z'])assert.equal(summary([response()],flow(undefined,created)).matchedResponses,0);
 assert.equal(summary([response()],flow().slice(1)).matchedResponses,0);
 assert.equal(summary([response()]).matchedResponses,1);
});
test('latest invalid answer is flagged rather than replaced by an older favorable answer',()=>{
 const s=summary([response(),response({portal:'',created:'2026-10-17T03:00:00.000Z'})]);
 assert.equal(s.validResponses,0);assert.equal(s.excluded.invalid,1);
 assert.throws(()=>summarize(csv(eventHeaders,flow()),csv(eventHeaders,flow())),/Sai loại tệp/);
  assert.equal(summary([response({created:'2026-02-30T02:00:00.000Z'})]).validResponses,0);
});
test('main statistics keep valid incomplete-flow feedback and report the logged subset separately',()=>{
 const responses=[response({email:'a@sample.invalid',price:0}),response({email:'b@sample.invalid',price:100}),response({email:'c@sample.invalid',price:1000000,portal:1,intent:'no'})];
 const s=summary(responses,[...flow('a@sample.invalid'),...flow('b@sample.invalid')]);
 assert.equal(s.validResponses,3);assert.equal(s.matchedResponses,2);
 assert.equal(s.willingnessToPay.median,100);assert.equal(s.willingnessToPay.zero,1);
 assert.equal(s.scores.portal.n,3);assert.equal(s.matchedScores.portal.n,2);
 assert.equal(s.scores.portal.mean,3);assert.equal(s.matchedScores.portal.mean,4);assert.equal(s.intent.no,1);
 assert.equal(s.incompleteFlow,1);
});
test('20 email records never become a claim of 20 independently verified people',()=>{
 const rows=Array.from({length:20},(_,i)=>response({email:'tester'+i+'@sample.invalid'}));
 const s=summary(rows,rows.flatMap(r=>flow(r.email)));
 assert.equal(s.minimum20Records,true);assert.equal(s.independentPeopleVerified,false);
 assert.match(reportMarkdown(s),/CHƯA xác minh 20 cá nhân/);
 const output=JSON.stringify(s)+reportMarkdown(s);
 for(const privateValue of [rows[0].email,rows[0].name,rows[0].liked,rows[0].disliked])assert.ok(!output.includes(privateValue));
});
test('CLI writes aggregates separately and cannot overwrite either raw export',()=>{
 const directory=mkdtempSync(join(tmpdir(),'taskhub-report-'));
 try {
  const feedback=join(directory,'feedback.csv'),events=join(directory,'events.csv');
  writeFileSync(feedback,csv(feedbackHeaders,[response()]));writeFileSync(events,csv(eventHeaders,flow()));
  run([feedback,events,join(directory,'out')]);
  const output=readFileSync(join(directory,'out','summary.json'),'utf8');
  assert.equal(JSON.parse(output).matchedResponses,1);assert.ok(!output.includes(response().email));
  const protectedFile=join(directory,'summary.json');writeFileSync(protectedFile,readFileSync(feedback));
  assert.throws(()=>run([protectedFile,events,directory]),/ghi đè/);
 } finally {rmSync(directory,{recursive:true,force:true});}
});
