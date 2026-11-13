const fs=require('fs'), solc=require('solc');
function read(p){return fs.readFileSync('node_modules/'+p,'utf8')}
const sources={
  'SafePayEscrow.sol': {content: fs.readFileSync('src/SafePayEscrow.sol','utf8')},
  '@openzeppelin/contracts/access/Ownable.sol': {content: read('@openzeppelin/contracts/access/Ownable.sol')},
  '@openzeppelin/contracts/utils/Context.sol': {content: read('@openzeppelin/contracts/utils/Context.sol')},
  '@openzeppelin/contracts/utils/ReentrancyGuard.sol': {content: read('@openzeppelin/contracts/utils/ReentrancyGuard.sol')},
  '@openzeppelin/contracts/token/ERC20/IERC20.sol': {content: read('@openzeppelin/contracts/token/ERC20/IERC20.sol')},
};
const input={language:'Solidity', sources, settings:{optimizer:{enabled:true,runs:200}, evmVersion:'london', viaIR:true, outputSelection:{'*':{'*':['abi','evm.bytecode']}}}};
const out=JSON.parse(solc.compile(JSON.stringify(input)));
if(out.errors) out.errors.forEach(e=>console.log(e.severity+': '+(e.formattedMessage||e.message).slice(0,400)));
const c=out.contracts['SafePayEscrow.sol']['SafePayEscrow'];
if(!c){console.log('no contract');process.exit(1)}
fs.writeFileSync('abi.json', JSON.stringify(c.abi,null,2));
fs.writeFileSync('bytecode.txt', c.evm.bytecode.object);
console.log('COMPILED',c.abi.length,'bytecode',c.evm.bytecode.object.length);
