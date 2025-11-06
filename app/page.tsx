import DisplayBoard from './components/Display/PaneViewer'
import { getMessages } from '@/lib/db'

export default async function HomePage() {
  const data = await getMessages()
  
  return (
    <main 
      className="w-screen h-screen overflow-hidden bg-black flex justify-center items-center"
    >
      <DisplayBoard initialData={data} />
    </main>
  )
}