let cameraStream=null;
const video=document.getElementById("camera");
const captureButton=document.getElementById("captureFace");
const cameraMessage=document.getElementById("cameraMessage");
function classifyColor(r,g,b){
 // Nearest RGB prototype; lighting and white balance can still cause mistakes.
 const refs={W:[235,235,225],R:[205,35,42],G:[35,165,75],Y:[235,205,35],O:[240,115,25],B:[35,85,190]};
 let best="W",score=Infinity;
 for(const [key,v] of Object.entries(refs)){const d=(r-v[0])**2+(g-v[1])**2+(b-v[2])**2;if(d<score){score=d;best=key}}
 return best;
}
document.getElementById("startCamera").onclick=async()=>{
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error("Trình duyệt không hỗ trợ camera hoặc trang chưa chạy HTTPS.");
  cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});
  video.srcObject=cameraStream;await video.play();captureButton.disabled=false;cameraMessage.textContent="Camera đã bật. Căn mặt Rubik vào khung 3×3 rồi nhấn Quét.";
 }catch(e){cameraMessage.textContent="Không mở được camera: "+e.message}
};
document.getElementById("stopCamera").onclick=()=>{if(cameraStream)cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;video.srcObject=null;captureButton.disabled=true;cameraMessage.textContent="Camera đã tắt."};
captureButton.onclick=()=>{
 if(!cameraStream||!video.videoWidth){cameraMessage.textContent="Camera chưa sẵn sàng.";return}
 const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0);
 const rect=video.getBoundingClientRect(),scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;
 const startX=canvas.width*.10,startY=canvas.height*.12,areaW=canvas.width*.80,areaH=canvas.height*.76;
 const positions=[1/6,1/2,5/6],found=[];
 for(const py of positions)for(const px of positions){
  const x=Math.max(0,Math.min(canvas.width-1,Math.round(startX+areaW*px)));
  const y=Math.max(0,Math.min(canvas.height-1,Math.round(startY+areaH*py)));
  const sample=ctx.getImageData(x,y,1,1).data;found.push(classifyColor(sample[0],sample[1],sample[2]));
 }
 // Center sticker is determined by the currently selected face's fixed center.
 const centerLabel=FACE_INFO.find(f=>f.id===activeFace).label;found[4]=centerLabel;
 facelets[activeFace]=found;renderAll();
 cameraMessage.textContent=`Đã lấy mẫu mặt ${activeFace}. Kiểm tra và sửa màu sai trước khi quét mặt tiếp theo.`;
};