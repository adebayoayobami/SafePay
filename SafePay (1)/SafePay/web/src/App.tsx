import { useState } from "react"
import { WagmiProvider, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RainbowKitProvider, ConnectButton, getDefaultConfig } from "@rainbow-me/rainbowkit"
import "@rainbow-me/rainbowkit/styles.css"
import { MEZO_CHAIN } from "./config"
import { AIReviewCard } from "./components/AIReviewCard"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESS } from "./config"
import { abi } from "./abi"

const config = getDefaultConfig({
  appName: "SafePay",
  projectId: "demo",
  chains: [MEZO_CHAIN as any],
  transports: { [MEZO_CHAIN.id]: http("https://rpc.test.mezo.org") },
}) as any
const qc = new QueryClient()

function Demo() {
  const [tab, setTab] = useState<"create"|"escrows">("create")
  const [demoScore] = useState(87)
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 bg-cream/80 backdrop-blur border-b px-4 py-3 flex justify-between items-center">
        <div className="font-black text-xl">SafePay <span className="font-normal text-sm bg-mint px-2 py-1 rounded-full">Mezo 31611</span></div>
        <ConnectButton />
      </header>
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-white rounded-card p-6 mb-6 border">
          <h1 className="text-3xl font-black">Lock it. Prove it. Get paid.</h1>
          <p className="text-gray-600 mt-2">Freelance escrow with AI brief-check • 0xbf1a...6358 on Mezo Testnet • <a className="underline" href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESS}`} target="_blank">Explorer</a></p>
          <div className="flex gap-2 mt-4">
            <button onClick={()=>setTab("create")} className={`px-4 py-2 rounded-full ${tab==="create"?"bg-ink text-white":"bg-gray-100"}`}>Create Escrow</button>
            <button onClick={()=>setTab("escrows")} className={`px-4 py-2 rounded-full ${tab==="escrows"?"bg-ink text-white":"bg-gray-100"}`}>My Escrows</button>
          </div>
        </div>

        <div className="bg-ink rounded-card p-4 mb-6 border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-white font-bold flex items-center gap-2">🚰 Need test tokens? <span className="bg-mint text-ink px-2 py-0.5 rounded-full text-xs">Free • No real money</span></div>
            <p className="text-white/70 text-sm mt-1">Get 0.1 test BTC + 2000 MUSD + MEZO for gas/fees. Paste your wallet → Claim → return here.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href="https://faucet.test.mezo.org" target="_blank" className="bg-mint text-ink px-5 py-2.5 rounded-full font-bold text-sm hover:opacity-90">Open Faucet ↗</a>
            <button onClick={()=>navigator.clipboard.writeText(window.location.href)} className="bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-full text-sm">Copy app link</button>
          </div>
        </div>
        <div className="bg-peach/40 border border-peach rounded-xl px-4 py-2.5 mb-6 text-sm flex items-center gap-2">
          <span>💡</span><span><b>First time?</b> 1) Open Faucet → 2) Claim → 3) Back here → Create Escrow with <b>5 MUSD</b> → Approve → Lock. Takes 20s.</span>
        </div>

        {tab==="create" ? <CreateForm /> : <EscrowList />}

        <div className="mt-8 bg-lilac rounded-card p-6 border">
          <h3 className="font-bold">✨ AI Review Card — minimal + cute (your edge)</h3>
          <p className="text-sm text-gray-600 mb-4">3-AI jury consensus, shows after delivery. Human still decides.</p>
          <AIReviewCard score={demoScore} consensus="3 jurors agree (Claude 88, GPT 87, Llama 86)" checks={[
            {label:"Bean icon included", ok:true},
            {label:"Brown & gold palette", ok:true},
            {label:"PNG delivered", ok:true},
            {label:"Source file missing", ok:false},
          ]} />
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-4 rounded-card border"><b>Deadline locked</b><p className="text-gray-600">Min 24h, can't change. Auto-claim only ≥60% AI.</p></div>
          <div className="bg-white p-4 rounded-card border"><b>Vault yield</b><p className="text-gray-600">Idle MUSD auto in sMUSD vault, yield to winner.</p></div>
          <div className="bg-white p-4 rounded-card border"><b>MEZO stake</b><p className="text-gray-600">Dispute → $5 MEZO each, loser loses to winner.</p></div>
        </div>
      </div>
    </div>
  )
}

function CreateForm(){
  const [freelancer, setFreelancer] = useState("")
  const [amount, setAmount] = useState("5")
  const [deadline, setDeadline] = useState("")
  const [brief, setBrief] = useState("Logo for coffee shop, brown + gold, bean icon, PNG + source")
  const { writeContract, data:hash, isPending } = useWriteContract()
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash })
  const create = () => {
    const dl = deadline ? Math.floor(new Date(deadline).getTime()/1000) : Math.floor(Date.now()/1000)+ 86400*3
    writeContract({ address: CONTRACT_ADDRESS, abi, functionName:"createEscrow", args:[freelancer as any, BigInt(Math.floor(parseFloat(amount)*1e18)), BigInt(dl), brief] } as any)
  }
  return (
    <div className="bg-white rounded-card p-6 border">
      <h2 className="font-bold text-lg mb-4">Create Escrow — lock MUSD</h2>
      <label className="text-sm">Freelancer wallet 0x...</label><input value={freelancer} onChange={e=>setFreelancer(e.target.value)} placeholder="0xD5bD..." className="w-full border rounded-xl p-3 mb-3" />
      <label className="text-sm">Amount MUSD</label><input value={amount} onChange={e=>setAmount(e.target.value)} className="w-full border rounded-xl p-3 mb-3" />
      <label className="text-sm">Delivery deadline (min 24h)</label><input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} className="w-full border rounded-xl p-3 mb-3" />
      <label className="text-sm">Brief (for AI jury)</label><textarea value={brief} onChange={e=>setBrief(e.target.value)} rows={3} className="w-full border rounded-xl p-3 mb-3" />
      <button onClick={create} disabled={isPending||confirming} className="bg-ink text-white px-6 py-3 rounded-full w-full">{isPending?"Confirm in wallet...":confirming?"Confirming...":"Lock $MUSD → approve then lock"}</button>
      {hash && <p className="text-xs mt-2 break-all">Tx: {hash} — check explorer.test.mezo.org</p>}
      <p className="text-xs text-gray-500 mt-2">First approve MUSD to contract, then create. Contract will auto-deposit to vault if set.</p>
    </div>
  )
}

function EscrowList(){
  const { data: nextId } = useReadContract({ address: CONTRACT_ADDRESS, abi, functionName:"nextEscrowId" }) as any
  const ids = nextId ? Array.from({length: Number(nextId)-1}, (_,i)=>i+1).reverse().slice(0,5) : []
  return (
    <div className="bg-white rounded-card p-6 border">
      <h3 className="font-bold mb-3">Recent Escrows (live on-chain)</h3>
      {ids.length===0 ? <p className="text-gray-500 text-sm">No escrows yet — create the first one above!</p> : ids.map(id=><EscrowRow key={id} id={id} />)}
    </div>
  )
}
function EscrowRow({id}:{id:number}){
  const { data } = useReadContract({ address: CONTRACT_ADDRESS, abi, functionName:"escrows", args:[BigInt(id)] }) as any
  if(!data) return null
  const [client, freelancer, amount, , , , status, , proofLink, , aiScore] = data as any[]
  const amt = Number(amount)/1e18
  const statuses = ["FUNDED","DELIVERED","RELEASED","REFUNDED","DISPUTED","RESOLVED"]
  return <div className="border rounded-xl p-3 mb-2 text-sm"><b>#{id} — {amt} MUSD — {statuses[Number(status)]}</b><div className="text-gray-600 break-all">Client {String(client).slice(0,10)}… → Freelancer {String(freelancer).slice(0,10)}…</div><div>AI: {String(aiScore)}% {proofLink && <>• Proof: {proofLink.slice(0,40)}</>}</div></div>
}

export default function App(){ return <WagmiProvider config={config}><QueryClientProvider client={qc}><RainbowKitProvider><Demo /></RainbowKitProvider></QueryClientProvider></WagmiProvider> }
