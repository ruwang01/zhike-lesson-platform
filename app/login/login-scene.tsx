'use client';
import {Component,useEffect,useRef,useState,type ReactNode} from 'react';
import dynamic from 'next/dynamic';
import {loginPlaces,placeTime,type LoginPlace} from './places';
import styles from './login.module.css';

const EarthGlobe=dynamic(()=>import('./earth-globe'),{ssr:false,loading:()=>null});
class GlobeBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true}}
  componentDidCatch(){this.props.onError()}
  render(){return this.state.failed?null:this.props.children}
}
export default function LoginScene(){
  const [selected,setSelected]=useState<LoginPlace>(loginPlaces[0]);
  const [instant,setInstant]=useState<Date|null>(null);
  const [size,setSize]=useState(460);
  const [ready,setReady]=useState(false);
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const update=()=>setInstant(new Date());
    const visible=()=>{if(document.visibilityState==='visible')update()};
    update();const timer=window.setInterval(update,30_000);
    document.addEventListener('visibilitychange',visible);
    return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',visible)};
  },[]);
  useEffect(()=>{
    const element=host.current;if(!element)return;
    const observer=new ResizeObserver(([entry])=>setSize(Math.round(Math.min(590,entry.contentRect.width))));
    observer.observe(element);return()=>observer.disconnect();
  },[]);
  return <section className={styles.scene} aria-label="世界城市当地时间">
    <div className={styles.globeSpace} ref={host} data-login-globe>
      <div className={styles.globeShadow} aria-hidden="true"/>
      <div className={styles.poster} hidden={ready} role="img" aria-label="地球"/>
      <GlobeBoundary onError={()=>setReady(false)}><EarthGlobe size={size} place={selected} onReady={setReady} onSelectPlace={setSelected}/></GlobeBoundary>
    </div>
    <div className={styles.places} aria-label="选择地点">
      {loginPlaces.map(place=><button key={place.id} type="button" className={styles.place} aria-pressed={selected.id===place.id} onClick={()=>setSelected(place)}>
        <span className={styles.placeName}>{place.name}</span>
        <time className={styles.time} suppressHydrationWarning>{instant?placeTime(instant,place.timeZone):'--:--'}</time>
      </button>)}
    </div>
  </section>;
}
