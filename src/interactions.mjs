// Record controls and timing, never typed text, passwords, file names or form values.
const labels=['Đóng','Xong','Hủy','Tạo tour','Lưu hành trình','Dùng nội dung tour','Danh mục Én Việt','Nhập Excel','Tải mẫu','Giao công việc','Xem cổng khách hàng','Cổng khách hàng','Về điều hành','Quản lý tour','Công việc','Tổng quan','Yêu cầu tư vấn','Thử tải lại','Xóa bộ lọc','Đăng xuất','Ghi nhận thu','Xác nhận ghép','Hủy phiếu','Tạo phiếu ghép','Ghép tour B2B','Đối soát CSV'];
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
let active=null;
export async function flushInteractions(){if(active)await active.flush();}
export function startInteractions(user) {
  if(!user||['admin','reviewer','staff'].includes(user.role))return ()=>{};
  const queue=[];let running=null,retryAfter=0;
  const flush=()=>{
    if(running)return running;
    if(!queue.length||Date.now()<retryAfter)return Promise.resolve();
    const batch=queue.slice(0,50);
    running=fetch('/api/interactions',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json','X-TaskHub':'1'},body:JSON.stringify({events:batch})})
      .then(r=>{if(!r.ok)throw Error('unavailable');queue.splice(0,batch.length);retryAfter=0;})
      .catch(()=>{retryAfter=Date.now()+15000;}).finally(()=>{running=null;});
    return running;
  };
  const record=e=>{
    const el=e.target instanceof Element?e.target.closest('button,a,select,input[type="checkbox"],input[type="radio"],input[type="file"]'):null;
    if(!el||el.disabled||(e.type==='change'&&!el.matches('select,input'))||(e.type==='click'&&el.matches('select')))return;
    const label=el.textContent?.trim();
    const aria=el.getAttribute('aria-label');
    const safeAria=['Đóng','Đăng xuất','Mở menu','Đóng menu điều hành','Đóng thông báo'].includes(aria)?slug(aria):null;
    const ordinal=[...document.querySelectorAll(el.tagName)].indexOf(el);
    const auto=safeAria||(labels.includes(label)?slug(label):`${el.tagName.toLowerCase()}:${[...el.classList].map(slug).filter(Boolean).slice(0,2).join('-')||el.type||'control'}:${ordinal}`);
    const control=el.dataset.track||el.getAttribute('name')||auto;
    const nav=document.querySelector('.sidebar [aria-current="page"]')?.dataset.track||'portal';
    const area=location.pathname==='/app'?nav:'portal';
    queue.push({id:crypto.randomUUID(),kind:e.type,control:control.slice(0,120),area,at:new Date().toISOString(),target:el.closest('[data-track-entity]')?.dataset.trackEntity});
    if(queue.length>500)queue.shift();
  };
  active={flush};
  document.addEventListener('click',record,true);document.addEventListener('change',record,true);
  const hide=()=>{void flush();};window.addEventListener('pagehide',hide);
  const timer=setInterval(flush,1500);
  return ()=>{clearInterval(timer);document.removeEventListener('click',record,true);document.removeEventListener('change',record,true);window.removeEventListener('pagehide',hide);void flush();active=null;};
}
