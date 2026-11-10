(() => {
 const host=document.getElementById("cube3d");
 if(!window.THREE){host.innerHTML='<div class="cube-fallback">Không tải được Three.js. Kiểm tra kết nối mạng.</div>';return}
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x100b1c);
 const camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(5,4,6);camera.lookAt(0,0,0);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.innerHTML="";host.appendChild(renderer.domElement);
 scene.add(new THREE.AmbientLight(0xffffff,1.8));const light=new THREE.DirectionalLight(0xffffff,2.4);light.position.set(4,6,5);scene.add(light);
 const group=new THREE.Group();scene.add(group);
 const black=new THREE.MeshStandardMaterial({color:0x17131f,roughness:.55});
 const mats={
  U:new THREE.MeshStandardMaterial({color:0xf4f2ed}),D:new THREE.MeshStandardMaterial({color:0xfacc15}),
  F:new THREE.MeshStandardMaterial({color:0x22c55e}),B:new THREE.MeshStandardMaterial({color:0x3b82f6}),
  R:new THREE.MeshStandardMaterial({color:0xe53935}),L:new THREE.MeshStandardMaterial({color:0xfb923c})
 };
 const cubies=[];
 for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
  const geo=new THREE.BoxGeometry(.96,.96,.96);
  const materials=[x===1?mats.R:black,x===-1?mats.L:black,y===1?mats.U:black,y===-1?mats.D:black,z===1?mats.F:black,z===-1?mats.B:black];
  const mesh=new THREE.Mesh(geo,materials);mesh.position.set(x,y,z);group.add(mesh);cubies.push(mesh);
 }
 let dragging=false,px=0,py=0;
 renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;px=e.clientX;py=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
 renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;group.rotation.y+=(e.clientX-px)*.009;group.rotation.x+=(e.clientY-py)*.009;px=e.clientX;py=e.clientY});
 renderer.domElement.addEventListener("pointerup",()=>dragging=false);
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 new ResizeObserver(resize).observe(host);resize();
 function animate(){requestAnimationFrame(animate);renderer.render(scene,camera)}animate();
 window.renderCube3D=()=>{}; // Viewer is a manipulable 3D reference cube; solution steps remain in the move panel.
})();