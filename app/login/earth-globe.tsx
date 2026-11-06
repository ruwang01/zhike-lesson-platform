'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import Globe,{type GlobeMethods} from 'react-globe.gl';
import * as THREE from 'three';
import {loginPlaces,type LoginPlace} from './places';
import styles from './login.module.css';

const EARTH_IMG='/login/earth-blue-marble.jpg';
const BUMPS_IMG='/login/earth-topology.png';
const CLOUDS_IMG='/login/clouds.png';
const points=[...loginPlaces];
export interface EarthGlobeProps {
  size:number;
  place:LoginPlace;
  onReady:(ready:boolean)=>void;
  onSelectPlace:(place:LoginPlace)=>void;
}
export default function EarthGlobe({size,place,onReady,onSelectPlace}:EarthGlobeProps){
  const globeRef=useRef<GlobeMethods|undefined>(undefined);
  const [ready,setReady]=useState(false);
  const hasFocused=useRef(false);
  const surface=useMemo(()=>{
    const material=new THREE.MeshPhongMaterial({shininess:8,specular:0x27475b});
    material.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
        #include <map_fragment>
        // Lift the very dark satellite ocean while keeping land and cloud texture detail.
        float ocean = smoothstep(1.05, 1.6, diffuseColor.b / (max(diffuseColor.r, diffuseColor.g) + 0.001));
        diffuseColor.rgb = pow(diffuseColor.rgb, vec3(0.74)) * 1.20;
        diffuseColor.rgb += ocean * vec3(0.015, 0.057, 0.115);
      `);
    };
    material.customProgramCacheKey=()=> 'login-daylight-ocean-v2';
    return material;
  },[]);
  useEffect(()=>()=>{surface.map?.dispose();surface.bumpMap?.dispose();surface.dispose()},[surface]);
  const loaded=useCallback(()=>{setReady(true);onReady(true)},[onReady]);
  useEffect(()=>{
    const globe=globeRef.current;if(!globe||!ready)return;
    const renderer=globe.renderer(),controls=globe.controls(),scene=globe.scene();
    const sun=new THREE.DirectionalLight(0xffffff,1.7);sun.position.set(-3,1,4);
    globe.lights([new THREE.AmbientLight(0xffffff,2.28),sun]);
    renderer.toneMapping=THREE.NoToneMapping;renderer.setClearColor(0xffffff,0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
    controls.enableDamping=true;controls.dampingFactor=.08;
    controls.enablePan=false;controls.enableZoom=false;controls.autoRotate=false;
    controls.enableRotate=window.matchMedia('(pointer:fine)').matches;
    const stopTurn=()=>{const pov=globe.pointOfView();globe.pointOfView(pov,0)};
    const contextLost=(event:Event)=>{event.preventDefault();onReady(false)};
    controls.addEventListener('start',stopTurn);
    renderer.domElement.addEventListener('webglcontextlost',contextLost);
    const clouds=new THREE.Mesh(new THREE.SphereGeometry(globe.getGlobeRadius()*1.006,64,64),new THREE.MeshPhongMaterial({color:0xffffff,transparent:true,depthWrite:false}));
    clouds.visible=false;let disposed=false;
    new THREE.TextureLoader().load(CLOUDS_IMG,texture=>{
      if(disposed){texture.dispose();return}
      const alphaMap=buildAlphaMap(texture.image as HTMLImageElement);texture.dispose();if(!alphaMap)return;
      clouds.material.alphaMap=alphaMap;clouds.material.needsUpdate=true;
      clouds.visible=true;scene.add(clouds);
    });
    return()=>{
      disposed=true;controls.removeEventListener('start',stopTurn);
      renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      scene.remove(clouds);clouds.geometry.dispose();clouds.material.alphaMap?.dispose();clouds.material.dispose();
    };
  },[ready,onReady]);
  useEffect(()=>{
    const globe=globeRef.current;if(!globe||!ready)return;
    const reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const initial=!hasFocused.current;hasFocused.current=true;
    globe.pointOfView({lat:initial?24:place.lat,lng:place.lng,altitude:1.55},reduced||initial?0:850);
  },[place,ready]);
  return <div className={styles.globe} style={{opacity:ready?1:0}} aria-hidden="true">
    <Globe ref={globeRef} width={size} height={size} backgroundColor="rgba(0,0,0,0)"
      globeImageUrl={EARTH_IMG} bumpImageUrl={BUMPS_IMG} onGlobeReady={loaded}
      globeMaterial={surface}
      showAtmosphere atmosphereColor="#c7defb" atmosphereAltitude={.055}
      showGraticules={false} animateIn={false}
      pointsData={points} pointLat="lat" pointLng="lng" pointAltitude={.018}
      pointRadius={point=>(point as LoginPlace).id===place.id ? .82 : .5}
      pointColor={point=>(point as LoginPlace).id===place.id?'#193e80':'#f5fbfc'}
      pointsTransitionDuration={0} pointLabel={()=>''}
      onPointClick={point=>onSelectPlace(point as LoginPlace)}
    />
  </div>;
}

// Preserve the existing alpha-map conversion for the vendor cloud texture.
function buildAlphaMap(image: HTMLImageElement): THREE.CanvasTexture | null {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  try {
    ctx.drawImage(image, 0, 0, w, h);
  } catch {
    return null;
  }

  let src: ImageData;
  try {
    src = ctx.getImageData(0, 0, w, h);
  } catch {
    // 贴图跨域且未带 CORS 头，无法读取像素
    return null;
  }

  const data = src.data;
  const dst = ctx.createImageData(w, h);

  let sum = 0;
  let opaque = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    sum += a;
    if (a >= 250) opaque++;
    dst.data[i] = a;
    dst.data[i + 1] = a;
    dst.data[i + 2] = a;
    dst.data[i + 3] = 255;
  }

  const pixels = w * h;
  // 全透明或全不透明都说明没拿到有效的 alpha 通道
  if (sum === 0 || opaque === pixels) return null;

  ctx.putImageData(dst, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}
