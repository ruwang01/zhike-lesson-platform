import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'知课 · 中文教案工作台',description:'以知识图谱为依据，让每一个教学环节有据可循。国际中文教案设计、知识核验与配套材料。'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
