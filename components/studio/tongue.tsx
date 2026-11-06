'use client';

/** Line mark based on the muduo silhouette in the introduction illustration. */
export function TongueIcon({size=24,className,color='currentColor'}:{size?:number;className?:string;color?:string}){
 return (
  <svg
   width={size}
   height={size}
   viewBox="0 0 24 24"
   fill="none"
   stroke={color}
   strokeWidth={1.5}
   strokeLinecap="round"
   strokeLinejoin="round"
   className={className}
   aria-hidden="true"
   focusable="false"
  >
   <path d="M10 6V4.5a2 2 0 1 1 4 0V6M9.5 6h5l.6 2.6 2.7 1.7 2.2 9.5a27 27 0 0 0-16 0l2.2-9.5 2.7-1.7.6-2.6Z"/>
   <path d="m12 10.7 2.1 2.1-2.1 2.1-2.1-2.1 2.1-2.1ZM7.2 17.1a24 24 0 0 1 9.6 0M12 18.7v3.1m-.7 0h1.4"/>
  </svg>
 );
}

export default TongueIcon;
