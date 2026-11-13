export const abi = [
  { type:"function", name:"createEscrow", inputs:[{name:"freelancer",type:"address"},{name:"amount",type:"uint256"},{name:"deadline",type:"uint256"},{name:"briefHash",type:"string"}], outputs:[{type:"uint256"}], stateMutability:"nonpayable"},
  { type:"function", name:"deliver", inputs:[{name:"id",type:"uint256"},{name:"proofLink",type:"string"}], stateMutability:"nonpayable"},
  { type:"function", name:"postAIReview", inputs:[{name:"id",type:"uint256"},{name:"score",type:"uint8"},{name:"reviewHash",type:"bytes32"}], stateMutability:"nonpayable"},
  { type:"function", name:"release", inputs:[{name:"id",type:"uint256"}], stateMutability:"nonpayable"},
  { type:"function", name:"autoClaim", inputs:[{name:"id",type:"uint256"}], stateMutability:"nonpayable"},
  { type:"function", name:"refundExpired", inputs:[{name:"id",type:"uint256"}], stateMutability:"nonpayable"},
  { type:"function", name:"stakeDispute", inputs:[{name:"id",type:"uint256"}], stateMutability:"nonpayable"},
  { type:"function", name:"requestRevision", inputs:[{name:"id",type:"uint256"}], stateMutability:"nonpayable"},
  { type:"function", name:"escrows", inputs:[{name:"",type:"uint256"}], outputs:[{name:"client",type:"address"},{name:"freelancer",type:"address"},{name:"amount",type:"uint256"},{name:"deadline",type:"uint256"},{name:"deliveredAt",type:"uint256"},{name:"reviewEndsAt",type:"uint256"},{name:"status",type:"uint8"},{name:"briefHash",type:"string"},{name:"proofLink",type:"string"},{name:"aiReviewHash",type:"bytes32"},{name:"aiScore",type:"uint8"},{name:"arbiter",type:"address"},{name:"clientStaked",type:"bool"},{name:"freelancerStaked",type:"bool"}], stateMutability:"view"},
  { type:"function", name:"nextEscrowId", inputs:[], outputs:[{type:"uint256"}], stateMutability:"view"},
  { type:"event", name:"EscrowCreated", inputs:[{indexed:true, name:"id", type:"uint256"},{indexed:true, name:"client", type:"address"},{indexed:true, name:"freelancer", type:"address"},{name:"amount",type:"uint256"},{name:"deadline",type:"uint256"}]},
  { type:"event", name:"AIReviewed", inputs:[{indexed:true, name:"id", type:"uint256"},{name:"score",type:"uint8"},{name:"reviewHash",type:"bytes32"}]},
] as const;
