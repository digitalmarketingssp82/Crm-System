const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let _cachedSyncData = null;
let _cachedSyncTime = 0;

const DEFAULT_FOLDER_ID = '1OHR3g8GWBaVNAa7kB6aRdk-WYmCngWh_';

let CALL_LOGS_FILE = path.join(__dirname, '..', 'call_logs.json');
try {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !fs.existsSync(path.join(__dirname, '..'))) {
    const tmpPath = path.join('/tmp', 'call_logs.json');
    CALL_LOGS_FILE = tmpPath;
  }
} catch (e) {}

const KNOWN_CONTACT_PHONES = {
  "eaklovya chawla": "+919041444415",
  "eaklovya": "+919041444415",
  "mayur kheda": "+918054429147",
  "mayur kheda thekedar": "+918054429147",
  "monu thekedar": "+917986012851",
  "munna thekedar": "+919814941693",
  "sukhpreet sngh": "+918847684640",
  "sukhpreet singh": "+918847684640",
  "partap thekedar": "+917717273944",
  "jaswinder thekedar": "+918872193535",
  "jagtar singh thekedar": "+919517906829",
  "jagtar jagdev": "+919781915721",
  "gian chand thekedar": "+918872193535",
  "avtar thekedar": "+917986979203",
  "arvind thekedar": "+917986979203",
  "anwarul khan": "+917357441912",
  "anwarul": "+917357441912",
  "anwarul sir": "+917357441912",
  "anwarul sir plywood": "+917357441912",
  "randeep": "+919872519259",
  "renu kapoor": "+919876859703",
  "harjeet punjabi": "+919872519259",
  "gurpreet barnala": "+919877000020",
  "gurdeep singh mohalli": "+919877000020",
  "dilbar": "+919463206145",
  "aliakabar ansari": "+919463206145",
  "aliakabar": "+919463206145",
  "carpanter rambabu": "+918729083796",
  "rambabu kumar": "+918729083796",
  "jassa singh marbella": "+917009602488",
  "jassa singh": "+917009602488",
  "jagjit singh": "+919779800140",
  "jagjit 3034": "+919779800140",
  "guru nanak auto parts": "+919814177752",
  "karnail singh": "+919501036231",
  "pal singh thekedar": "+918146559158",
  "varun sec 82": "+918699391895",
  "varun kumar": "+918699391895",
  "sunil 144": "+919888800559",
  "sunil kumar": "+919888800559",
  "nirey plywood": "+919779122990",
  "pawan thekedar": "+917837740503",
  "ravi kumar": "+919812793309",
  "mann singh": "+917529051800",
  "aman 1615": "+919814066342",
  "deepak": "+919999672763",
  "flipkart": "+9118002029898",
  "flipkart customer service": "+9118002029898",
  "emergency number": "112",
  "kawaljeet": "+919814177752",
  "parvinder dhiman": "+919501854050",
  "krishan pal": "+919872673931",
  "sherbaz khan": "+919876111118",
  "saaransh saini": "+919877142366",
  "karan makhija": "+919417110526",
  "vijayalakshmy": "+918699555595",
  "vijayalakshmy r": "+918699555595",
"deepak": "+919999672763",
  "asha singh": "+919416336813",
  "mahesh tiwari": "+919914543333",
  "mr. parag ravish w": "+919812793309",
  "9779042289": "+919779042289",
  "rahul pal": "+918146559158",
  "harwinder singh": "+919592239595",
  "sundar kumar": "+917015904292",
  "vinod": "+916280033534",
  "sahil sharma": "+919056279246",
  "sharuk": "+918340210442",
  "amin chand": "+918707019675",
  "raj singh saroha": "+919810970800",
  "rajinder": "+916239502257",
  "kriti sharma": "+919317561594",
  "mr. surinder singh w": "+918910459215",
  "mr baldev singh thekedar mohali w": "+918699253575",
  "deepika sood": "+917580013001",
  "sujata": "+919872577586",
  "abhishek": "+919115124222",
  "z l mawlong": "+917085048482",
  "kuldeep singh": "+919855185075",
  "nawendu kumar jha": "+919780798550",
  "pankaj mohan": "+917056115511",
  "sharma": "+919813094408",
  "kamal chadha": "+919888382543",
  "rajender s bedi": "+919814302105",
  "akshay sardana": "+919988205800",
  "mr. akram, gmb": "+919870007886",
  "rahul": "+917973737878",
  "jasmin": "+918872853025",
  "kuljit": "+919878968681",
  "zubair thekedar mohali": "+918146278532",
  "infinium doors & windows r": "+919817666664",
  "anshumann bni": "+917529051800",
  "ajay sharma": "+919813840800",
  "ritesh kumar": "+918894341115",
  "manpreet singh": "+919845634151",
  "harsh tuli": "+919888885002",
  "sumit": "+919355396112",
  "devinder kumar": "+918219104443",
  "shadi sharma": "+917042614964",
  "pushpreet": "+918360570717",
  "naveen garg": "+919416035687",
  "m r puri": "+919780034968",
  "mr. vikram mohi khurda w": "+918437816715",
  "narinder": "+919650098446",
  "mr. ricky aerocity": "+918800634333",
  "mr. gurpreet singh bni": "+917527055586",
  "ankit": "+919463125137",
  "gourav garg": "+917814849075",
  "bharat": "+917009615993",
  "pardeep": "+919717555183",
  "rohil": "+919857100540",
  "narendra kumar sharma": "+919413330331",
  "rajiv": "+917355830001",
  "rahul jain": "+919855556335",
  "9780528097": "+918847383683",
  "ashish": "+919050315333",
  "avi handa": "+919780880484",
  "gurpreet singh": "+917527055586",
  "babu babusingh": "+919876571885",
  "rishi pal": "+919355783100",
  "amritpal singh": "+919417777743",
  "rhythm": "+918556000945",
  "mr. anant": "+919815984006",
  "mr. vijay r": "+919815994778",
  "vijay shekhawat": "+919780850852",
  "mr. pawan kumar": "+917837740503",
  "aman badwal": "+917986698881",
  "ms. varinder kaur": "+918054301777",
  "kapil": "+919719956371",
  "ranbir singh enq gmb": "+919876400058",
  "mo malik": "+918650574618",
  "suresh giri goswami": "+917889232706",
  "mukesh kumar": "+919781385067",
  "sunil kumar": "+919216407728",
  "rajesh kumar": "+917207220620",
  "manjinder kalsi": "+919056386554",
  "8968844066": "+918968844066",
  "mohan lal": "+919988584575",
  "anjani electro trans": "+919996594597",
  "sai gopal": "+917889017209",
  "anand mohan": "+919814520530",
  "rajesh sood": "+919915730979",
  "karanbir s. khaira": "+919877001010",
  "anant sidhu": "+919815984006",
  "lakhmir singh": "+919417250172",
  "pj singh": "+919815330910",
  "nirmal sandhu": "+919872116633",
  "vinod kumar": "+919466933955",
  "akshay arora": "+918591144944",
  "keshav": "+919780381412",
  "surya uday shimla gmb": "+919857900002",
  "rkg": "+919781921400",
  "gopal krishan": "+919318970888",
  "owais o": "+919888202005",
  "virender kaur": "+918054301777",
  "raj raj": "+919739391576",
  "vivek mani": "+919041676751",
  "gurkirpal dhatt": "+919815025500",
  "r̊o̊ẙ": "+919876244893",
  "girish prabhakar": "+919115552635",
  "charanjit singh": "+919814172939",
  "sanjay sharma": "+919417580303",
  "dr chetan nanda": "+919814628661",
  "kavi khanna": "+919418025462",
  "ਤੇਰਾ ਦੀਪ": "+917347566793",
  "harminder singh": "+919466658259",
  "charanjit singh channi": "+919872673931",
  "kanika sharma": "+918699907006",
  "ravidutt attri": "+918510017010",
  "kanishka kaur anand": "+919914979782",
  "prenika arvind sharma": "+919469892569",
  "diwakar sahoonja": "+919876119212",
  "cozy home decor": "+919858290546",
  "manjeet singh sethi": "+919464236200",
  "butta salh": "+918872215515",
  "mr. parag ravish h w": "+919812793309",
  "amit minglani": "+917696162838",
  "shohan": "+918626909793",
  "jaswinder singh badwal": "+918699440444",
  "vikas sharma": "+919653363858",
  "dhiraj kumar gupta": "+918262020986",
  "wood work contrater": "+916397258831",
  "pankaj gmb": "+918288857719",
  "deep katoch": "+917018153152",
  "aman kirpal": "+919876522285",
  "ajay": "+916283197612",
  "dheeraj grover": "+919814127823",
  "gurmony singh": "+919915134413",
  "ajit kumar": "+919534231148",
  "satpal": "+919872202140",
  "gaurav gandhi": "+919034099105",
  "ravindra rathee": "+919416300581",
  "janardhansharma5008": "+917458852977",
  "manmohan": "+919815613421",
  "rajkamal gandhi": "+919816428880",
  "rajesh": "+919814111536",
  "paramjit singh": "+919814203886",
  "neha ji hw": "+919815984329",
  "sanjay sood": "+919888000391",
  "meenu": "+918146367711",
  "anil": "+919877758533",
  "ram kumar": "+919463019310",
  "kailash singh": "+919988993402",
  "avinash": "+919815690001",
  "sukhvinder singh": "+917837053665",
  "puneet arora": "+919896321531",
  "viney negi": "+919569843730",
  "karanbir singh": "+919814680949",
  "bhupender singh siyal": "+919459240496",
  "rakesh kalra": "+918146795795",
  "nikhil mehla": "+917009769443",
  "rakesh mittal": "+919988707737",
  "himmat singh": "+917009736903",
  "mr.dilnawaz mirza": "+919592941583",
  "anju kumari": "+917667839765",
  "neeraj": "+918901450678",
  "lakhmir carpenter": "+919781144621",
  "himanshi singh": "+917986968080",
  "ramesh negi": "+919817829739",
  "jaswant singh": "+919815655178",
  "amrinder singh virk": "+918054011377",
  "mr. naveen r": "+919888123522",
  "jaideep goyal": "+919876172999",
  "jugbir boora": "+917876500077",
  "baljinder singh": "+919592340007",
  "sharanjit kaur": "+919878038078",
  "gaurav pal": "+919416297670",
  "jyoti parkash sharma": "+919815506660",
  "ved parkashverma": "+919056416722",
  "daud": "+918923669758",
  "kamaljeet": "+917988271228",
  "jagmeet singh": "+919872362995",
  "mr. r.k saini w": "+919646117704",
  "amit bansal": "+919882327735",
  "ram sarup sharma": "+919876764572",
  "salman gmb": "+917500328124",
  "angraj thekedar": "+919671494227",
  "anand carpenter": "+919065379196",
  "amritpal singh thekedar": "+918360184065",
  "amrit singh carpenter": "+917340999407",
  "amrinder singh": "+917009534277",
  "amit singh thekedar": "+917015490176",
  "amit carpenter new": "+919779147824",
  "amir khan carpenter": "+916284450891",
  "amir ali carpenter": "+919870338779",
  "ajay thekedar": "+919501367006",
  "ahsan carpenter": "+919463343774",
  "amrik singh saini carpenter": "+919988357080",
  "amrik carpenter falcon": "+919855870902",
  "amardeep singh carpenter": "+919803030388",
  "amandeep singh new chd carpenter": "+918283846435",
  "ajay kumar thekedar": "+919115019533",
  "ansan carpenter": "+919463343774",
  "afzal carpenter": "+919888394630",
  "abdul carpenter": "+919888610909",
  "alam carpenter.": "+917986674347",
  "shyam lal": "+917888722234",
  "kailash": "+919682534248",
  "puran dhiman thekedar ref by avtar thekedar": "+917986979203",
  "jaggi": "+919878582117",
  "gurmail thekedar": "+919855156161",
  "meenu badhwar": "+919216712787",
  "nachhattar singh": "+919417117300",
  "jaspreet singh narang": "+919876938088",
  "luxman singh": "+919050940350",
  "vijay bahadur": "+917696552200",
  "u d singh": "+919815970203",
  "dinesh kumar": "+917988695768",
  "kaushal": "+919915083500",
  "deshraj": "+919217433747",
  "majerkhan7860": "+917009005936",
  "tarvinder kaur gmb": "+919417444750",
  "reeva rohit narula": "+917015385902",
  "jai ram": "+919855582580",
  "rajesh kumar pkl gmb": "+919467529060",
  "jag mohan": "+919416710063",
  "mr. prabh,": "+917356345435",
  "palwinder singh": "+919815040172",
  "ankit aggarwal": "+919888224510",
  "mr. kamalveer gill": "+919876147060",
  "sohan lal carpenter": "+919814975477",
  "mr. jaswant singh": "+919418169098",
  "sharma interrior": "+917061004993",
  "vikram.aingh": "+919878284231",
  "ssharma": "+917814383266",
  "bs136638": "+916280074130",
  "harpreet": "+919877142366",
  "mr. surjeet": "+918968847226",
  "shilpa pathak": "+919876764720",
  "pawan kumar": "+917837740503",
  "ms. jasnoor gmb": "+919306461334",
  "vikram gupta": "+919812043734",
  "jyoti": "+919115499939",
  "yogeshchd@rediffmail.com": "+919815717739",
  "mr. pavitar singh grewal": "+917888737518",
  "pavitar singh grewal": "+917888737518",
  "harvinder kumar": "+919805730626",
  "mr. rajesh w": "+919814111536",
  "inderesh kumar": "+919888810998",
  "agantook": "+919501826762",
  "aakriti bhatt": "+919814606740",
  "ajay singh rana": "+917018629523",
  "aman rupal": "+919815928229",
  "सुभाष रघुवंशी": "+918219860971",
  "masti with khushi": "+918826750958",
  "sahil vashisht": "+919780020307",
  "mr. kant mandi simla": "+918894892235",
  "varinder miglani": "+919814466788",
  "rahul kataria": "+917696219355",
  "afjal": "+919888394630",
  "gurdeep singh enq online": "+916284255137",
  "musskan": "+918283825815",
  "jatinder singh": "+918699423766",
  "jay shri ram": "+919780595209",
  "sanjeev": "+919501017341",
  "sain ram shyam": "+918219670957",
  "mr. gurinder singh": "+919417472677",
  "aaqib javid": "+916239760082",
  "vinod sharma": "+919418298915",
  "hemant kumar": "+919041247270",
  "bipan bagga": "+917973686521",
  "nawjeet singh bedi": "+918918016233",
  "mrs. surinder khatri gmb": "+919438370510",
  "maninder pal mohali gmb": "+919417195964",
  "maan_praveenhnkiim.i": "+918146065105",
  "sanju test": "+917814435761",
  "rajeev garg": "+919729250246",
  "rahul bansal": "+919555954849",
  "amarjeet kaur": "+918360042131",
  "proksh": "+918059445566",
  "manish kumar": "+919779980836",
  "saurabh sharma gmb": "+917508256531",
  "naman gmb": "+919417807907",
  "mr. ashwani bhardwaj": "+919465373633",
  "jasnoor interior designer": "+919306461334",
  "sanjeev varshney": "+919815717361",
  "sumit gmb": "+918708960692",
  "ashwani": "+919465373633",
  "mona gmb mitesh mlp galleria": "+918800760728",
  "gagana btauli": "+918427795395",
  "gurcharan singh": "+919466077700",
  "kant hingorani": "+919816509682",
  "sonu": "+919915819349",
  "rajnish chinta": "+918278835470",
  "abhinav gohri": "+917015248378",
  "manjit singh": "+918557011635",
  "rajnish malik": "+919988401103",
  "kailash bushari": "+918219977430",
  "ajay kumar jain": "+919478630011",
  "harbhajan singh": "+919653873013",
  "amit sehgal": "+919816019001",
  "tarika madan_test": "+919779744428",
  "mr.dilpreet singh m": "+919914093335",
  "harpreet saini": "+918054008482",
  "sudhir jain": "+918146367711",
  "anup": "+919418446856",
  "mr. devender": "+919530723238",
  "deepak panwar": "+919459024363",
  "mr. arvind": "+919416583677",
  "daksh arora": "+919816502727",
  "krishna mohan test": "+916591002242",
  "sanjeev thakur": "+919971657598",
  "nikhil rajput": "+917807338154",
  "nirmita": "+917901856153",
  "rajesh garg": "+919896670336",
  "shyamlal": "+919805042024",
  "priyanka sonker": "+917814941639",
  "deepak yongma": "+917018503126",
  "ravinder gupta": "+919418492666",
  "priyanka rana": "+917206220489",
  "krishna test": "+918950281868",
  "mo irfan": "+917895188821",
  "ramesh sharma": "+919418211206",
  "poonam": "+919888810811",
  "harvinder": "+919888810811",
  "poonam (harvinder)": "+919888810811",
  "shakuntla devi": "+919872019485",
  "shakuntla": "+919872019485",
  "nil kamal devi": "+919872019485",
  "sahil": "+919056279246",
  "surinder kumar": "+918910459215",
  "surinder": "+918910459215",
  "mr. surinder singh (w)": "+918910459215",
  "chetan gumber": "+919814628661",
  "chetan": "+919814628661",
  "dispatch np": "+919815045700",
  "kiranjot singh": "+919872412345",
  "amardeep nijjar": "+919803030388",
  "harpreet singh": "+919877142366",
  "kulwant singh": "+919814421127",
  "rajni bhat": "+919876521035",
  "priyanka vasisht": "+917814941639",
  "eshan gaur": "+919814120340",
  "monu kitchen": "+916280251494",
  "monu kitchen np": "+916280251494",
  "parminder singh": "+918558055750",
  "sushil kumar": "+919815045731",
  "shr": "+917015274682",
  "dinesh highland": "+917988695768",
  "dinesh highland hn no 9": "+917988695768",
  "jagjeevan gmb": "+919815045732",
  "jagjeevan gmb mohali": "+919815045732",
  "nikhil mishra": "+919151610556",
  "tushar sharma": "+919501653648",
  "anwarul sir": "+917357441912",
  "anwarul sir plywood": "+917357441912",
  "suresh chand": "+919876754841",
  "rajni rani singla": "+919877865282",
  "vikram jeet singh": "+918437816715",
  "sukhwinder singh": "+917814304573",
  "asam ali": "+916284538873",
  "satpal singh": "+917015920657",
  "mohan bni": "+919803353372",
  "mohan bni id 17": "+919803353372",
  "megha kumari": "+917503238194",
  "ranjeet kaur": "+919915911009",
  "rakesh kumar singh": "+918146795795",
  "meenu saxena": "+918146367711",
  "parag ravish": "+919877808859",
  "parmjit singh": "+919876111118",
  "shiv charan": "+919814015003",
  "rupinder singh": "+917508648100",
  "manga khan": "+919878685521",
  "jaimal singh": "+919814017001",
  "shweta malik": "+919814804391",
  "fakir chand": "+919463913526",
  "akash gupta ambala": "+919034236263",
  "akshay bhatnagar": "+918287589854",
  "manoj balai": "+919814015003",
  "rajiv atri": "+919876543210",
  "sanju sir plywoods": "+919814015003",
  "mr. parag ravish (w)": "+919812793309",
  "mr baldev singh thekedar mohali(w)": "+918699253575",
  "nawendu  kumar jha": "+919780798550",
  "mr. akram,  (gmb)": "+919870007886",
  "infinium doors & windows (r)": "+919817666664",
  "mr. vikram mohi khurda (w)": "+918437816715",
  "mr. gurpreet singh  bni": "+917527055586",
  "mr. vijay r)": "+919815994778",
  "mr. pawan  kumar": "+917837740503",
  "kanika  sharma": "+918699907006",
  "mr. parag ravish h (w)": "+919812793309",
  "mr.dilnawaz (mirza)": "+919592941583",
  "mr. naveen(r)": "+919888123522",
  "mr. r.k  saini (w)": "+919646117704",
  "amit carpenter (new)": "+919779147824",
  "amandeep singh new (chd) carpenter": "+918283846435",
  "puran dhiman thekedar (ref by avtar thekedar)": "+917986979203",
  "ms. jasnoor (gmb)": "+919306461334",
  "mr. rajesh (w)": "+919814111536",
  "ks": "+918699555595",
  "mrs. surinder khatri (gmb)": "+919438370510",
  "mona gmb (mitesh mlp galleria)": "+918800760728",
  "mr.dilpreet singh(m)": "+919914093335",
  "krishna mohan - test": "+916591002242"
};

function resolveContactNameToPhone(contactName) {
  if (!contactName) return '';
  const str = String(contactName).toLowerCase().replace(/[\(\)\-\_]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!str || str === 'direct phone call' || str === 'direct customer call' || str === 'customer call') return '';
  if (KNOWN_CONTACT_PHONES[str]) return KNOWN_CONTACT_PHONES[str];
  const normalizedStr = str.replace(/[^a-z0-9]/g, '');
  for (const [k, p] of Object.entries(KNOWN_CONTACT_PHONES)) {
    const normalizedKey = k.replace(/[^a-z0-9]/g, '');
    if (normalizedStr === normalizedKey) return p;
  }
  for (const [k, p] of Object.entries(KNOWN_CONTACT_PHONES)) {
    if (k.length >= 4 && (str.includes(k) || k.includes(str))) {
      return p;
    }
  }
  return '';
}
const KNOWN_DRIVE_MAPPINGS = {
  "1kEXZhk0_hNZO73IoWcXysD4EmIH__-ZY": { "name": "+917696013856", "phone": "+917696013856", "dur": 45, "time": "6 Nov, 04:48 PM", "device": "OnePlus", "dir": "INBOUND", "file": "+917696013856-2611061648.mp3" },
  "1nXiA0L0TWdnhnkEwU0JaUmXe8tytCMha": { "name": "Eaklovya Chawla", "phone": "+919041444415", "dur": 45, "time": "6 Nov, 03:42 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Eaklovya Chawla-2611061542.mp3" },
  "1LLWmAfmRqAEN7lfFKfzhgj81foxHNpPI": { "name": "Simran Ssp", "phone": "", "dur": 45, "time": "6 Nov, 03:21 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Simran Ssp-2611061521.mp3" },
  "1WqPZk3XWZhM79sSHVd3yoL9huIGdbgi3": { "name": "Manjit Singh", "phone": "+918557011635", "dur": 45, "time": "6 Nov, 03:16 PM", "device": "OnePlus", "dir": "INBOUND", "file": "8557011635-2611061516.mp3" },
  "1OcJAyBcng6ZqoajEUG_nbHUuYGYNeKvZ": { "name": "Manjit Singh", "phone": "+918557011635", "dur": 45, "time": "6 Nov, 03:14 PM", "device": "OnePlus", "dir": "INBOUND", "file": "8557011635-2611061514.mp3" },
  "1THMn-UJt9_NQkuJHtX3CKlSBhGAkn7Ye": { "name": "Dispatch Np", "phone": "+919815045700", "dur": 45, "time": "6 Nov, 01:44 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Dispatch Np-2611061344.mp3" },
  "1vaV9obaubEhvUGbMPHhjU6P8_t7EyUBa": { "name": "Dispatch Np", "phone": "+919815045700", "dur": 45, "time": "6 Nov, 01:16 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Dispatch Np-2611061316.mp3" },
  "1MrHgOcUlZU5qv3Le2-xncQGUYRvBOHQR": { "name": "Dispatch Np", "phone": "+919815045700", "dur": 45, "time": "6 Nov, 11:45 AM", "device": "OnePlus", "dir": "INBOUND", "file": "Dispatch Np-2611061145.mp3" },
  "1zb89USnVvWzzpPgRFGR8pZvvQ5HBzSZo": { "name": "Shakuntla Devi", "phone": "+919872019485", "dur": 45, "time": "6 Nov, 11:29 AM", "device": "OnePlus", "dir": "INBOUND", "file": "Shakuntla Devi-2611061129.mp3" },
  "1RWJvm1zXCyqKNf2Gm_Ozneh8AcbvgBrF": { "name": "+918427761777", "phone": "+918427761777", "dur": 45, "time": "6 Nov, 11:27 AM", "device": "OnePlus", "dir": "INBOUND", "file": "+918427761777-2611061127.mp3" },
  "1_kF0SwikhBib9iJSqhxkAfN9EDUsB2m8": { "name": "Sahil", "phone": "+919056279246", "dur": 28, "time": "6 Nov, 10:54 AM", "device": "OnePlus", "dir": "INBOUND", "file": "Sahil-2611061054.mp3" },
  "1--a2nAnc2gSjjZaVsZij8A4KBY2EumFz": { "name": "Surinder Kumar", "phone": "+918910459215", "dur": 28, "time": "5 Nov, 06:29 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Surinder Kumar-2611051829.mp3" },
  "1dpRMXa_ZIYTzHGxFb-M6Sljwuoz0w1Sy": { "name": "Chetan Gumber", "phone": "+919814628661", "dur": 45, "time": "05 Nov, 05:04 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Chetan Gumber-2611051704.mp3" },
  "1LHCu17VhfALSe97YgZTv7MfUAn2hjmMS": { "name": "KIRANJOT SINGH", "phone": "+919872412345", "dur": 39, "time": "5 Nov, 02:56 PM", "device": "OnePlus", "dir": "INBOUND", "file": "KIRANJOT SINGH-2611051456.mp3" },
  "1on8TzhkXrnG2F-K8fA6SY9srlnNZSCpE": { "name": "+917942748821", "phone": "+917942748821", "dur": 26, "time": "05 Nov, 01:38 PM", "device": "OnePlus", "dir": "INBOUND", "file": "+917942748821-2611051337.mp3" },
  "1HcI8qnsAsO4PmSvl9YVbD3pgQUSgU69e": { "name": "+918427761777", "phone": "+918427761777", "dur": 225, "time": "05 Nov, 01:35 PM", "device": "OnePlus", "dir": "INBOUND", "file": "+918427761777-2611051332.mp3" },
  "1v6HE2E6CufBnzsJ9oBdmgjxJ_dCNHrvN": { "name": "9466609171", "phone": "+919466609171", "dur": 42, "time": "05 Nov, 01:21 PM", "device": "iQOO", "dir": "OUTBOUND", "file": "9466609171-2611051320.mp3" },
  "1sAcuoUO6hJhFQIi0r8SGLOYnxwA-YLMa": { "name": "AKSHAY BHATNAGAR", "phone": "+918287589854", "dur": 51, "time": "05 Nov, 01:30 PM", "device": "OnePlus", "dir": "INBOUND", "file": "AKSHAY BHATNAGAR-2611051329.mp3" },
  "12oZbi1MQ5TTcwimtmJU69f_bHvmjUB51": { "name": "Akash Gupta Ambala", "phone": "+919034236263", "dur": 34, "time": "05 Nov, 12:54 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Akash Gupta Ambala-2611051253.mp3" },
  "1fDK3IyrKMBBa8CgqBfzT7MzKROp3mivN": { "name": "Fakir Chand", "phone": "+919463913526", "dur": 73, "time": "05 Nov, 12:33 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Fakir Chand-2611051232.mp3" },
  "1AzDIMD3Y961_qeeWC53TglNKM_ILQphF": { "name": "( Spam Alert From Jio) Mazed Mallick", "phone": "+918293805138", "dur": 45, "time": "05 Nov, 12:13 PM", "device": "OnePlus", "dir": "INBOUND", "file": "( Spam Alert From Jio) Mazed Mallick-2611051213.mp3" },
  "1mDYWSyB2RMebaSiYYc6Uky4ne6TCWh4Q": { "name": "Poonam (Harvinder)", "phone": "+919888810811", "dur": 25, "time": "04 Nov, 02:44 PM", "device": "iQOO", "dir": "OUTBOUND", "file": "POONAM-2611041445.mp3" },
  "1tPx5V2Fy0LoiehKmOzIpLbixxO9BtJiT": { "name": "Poonam (Harvinder)", "phone": "+919888810811", "dur": 30, "time": "04 Nov, 02:46 PM", "device": "iQOO", "dir": "OUTBOUND", "file": "POONAM-2611041446.mp3" },
  "1jHNtG1sSzcYxrgEZMwu-rXRCFr0LwOB_": { "name": "PARMINDER SINGH", "phone": "+918558055750", "dur": 22, "time": "2 Nov, 05:12 PM", "device": "OnePlus", "dir": "INBOUND", "file": "PARMINDER SINGH-2611021712.mp3" },
  "1yXaNUei3OjuxgELlqKxydp85J0veX5nO": { "name": "Sushil Kumar", "phone": "+919815045731", "dur": 57, "time": "2 Nov, 04:50 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Sushil Kumar-2611021650.mp3" },
  "1Mq7sdU7WhnfjEPS13ieba0bNYdIw__in": { "name": "Shr", "phone": "+917015274682", "dur": 21, "time": "2 Nov, 04:46 PM", "device": "OnePlus", "dir": "OUTBOUND", "file": "Shr-2611021646.mp3" }
};

function fetchDriveFolderHTML(folderId) {
  return new Promise((resolve) => {
    const urlStr = 'https://drive.google.com/embeddedfolderview?id=' + folderId;
    https.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function parseDriveRecordings(html, forcedDevice = "Auto") {
  const recordings = [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Method 1: Modern Google Drive flip-entry markup (800+ files)
  const flipRegex = /<div class="flip-entry"[^>]*id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/gi;
  let m;
  const rawItems = [];

  while ((m = flipRegex.exec(html)) !== null) {
    const id = m[1];
    const name = m[2].trim();
    if (name.endsWith('.m4a') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.aac') || name.endsWith('.amr')) {
      rawItems.push({ id, name, size: 500000 });
    }
  }

  // Method 2: Fallback to _DRIVE_ivd if flip-entry was empty
  if (rawItems.length === 0) {
    const ivdMatch = html.match(/_DRIVE_ivd[\s\S]*?=\s*'([^']+)'/);
    if (ivdMatch) {
      try {
        const unescaped = ivdMatch[1].replace(/\\x([0-9A-Fa-f]{2})/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
        const parsed = JSON.parse(unescaped);
        if (Array.isArray(parsed[0])) {
          parsed[0].forEach(it => {
            const id = it[0];
            const name = it[2] || '';
            const size = it[13] || 0;
            if (name.endsWith('.m4a') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.aac') || name.endsWith('.amr')) {
              rawItems.push({ id, name, size });
            }
          });
        }
      } catch(e){}
    }
  }

  rawItems.forEach(it => {
    const id = it.id;
    const name = it.name;
    const size = it.size || 500000;

    let isoTimestamp = null;
    let yymmdd = '';
    let formattedTime = '';
    let phoneDigits = '';
    let contactName = '';
    let isOnePlus = false;
    let deviceName = 'Samsung Galaxy';

    // Pattern 1: Samsung Galaxy format: Call recording [Name/Number]_[YYMMDD]_[HHMMSS].m4a
    const samsungMatch = name.match(/^Call recording\s+(.+?)_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.(m4a|mp3)$/i);
    // Pattern 2: OnePlus format: [Name/Number]-[YYMMDDHHMM].mp3
    const oneplusMatch = name.match(/^(?:(.+?)[_-])?(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\.(mp3|m4a|wav|aac)$/i);
    // Pattern 3: Vivo / iQOO format: [Prefix]_[YYYYMMDD]_[HHMMSS].(aac|amr|mp3|m4a|wav) OR Record_[Prefix]_[YYMMDD]_[HHMMSS]
    const vivoMatch = name.match(/^(?:Record[_-])?(?:(.+?)[_-])?(\d{4}|\d{2})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})?\.(aac|amr|mp3|m4a|wav|ogg)$/i);

    if (samsungMatch) {
      deviceName = 'Samsung Galaxy';
      const [_, prefix, yy, mm, dd, hh, min, ss] = samsungMatch;
      yymmdd = `20${yy}-${mm}-${dd}`;
      const d = new Date(`20${yy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`);
      if (!isNaN(d.getTime())) isoTimestamp = d.toISOString();
      const mIdx = parseInt(mm, 10) - 1;
      const hInt = parseInt(hh, 10);
      const ampm = hInt >= 12 ? 'PM' : 'AM';
      const h12 = hInt % 12 || 12;
      formattedTime = `${parseInt(dd, 10)} ${months[mIdx]}, ${h12 < 10 ? '0' + h12 : h12}:${min} ${ampm}`;
      
      const pMatch = prefix.match(/(?:\+?91)?([6-9]\d{9})/);
      if (pMatch) {
        phoneDigits = pMatch[1];
      } else {
        contactName = prefix.trim();
      }
    } else if (oneplusMatch) {
      deviceName = 'OnePlus';
      isOnePlus = true;
      const [_, prefix, yy, mm, dd, hh, min, ss] = oneplusMatch;
      yymmdd = `20${yy}-${mm}-${dd}`;
      const sec = ss || '00';
      const d = new Date(`20${yy}-${mm}-${dd}T${hh}:${min}:${sec}+05:30`);
      if (!isNaN(d.getTime())) isoTimestamp = d.toISOString();
      const mIdx = parseInt(mm, 10) - 1;
      const hInt = parseInt(hh, 10);
      const ampm = hInt >= 12 ? 'PM' : 'AM';
      const h12 = hInt % 12 || 12;
      formattedTime = `${parseInt(dd, 10)} ${months[mIdx]}, ${h12 < 10 ? '0' + h12 : h12}:${min} ${ampm}`;

      if (prefix) {
        const pMatch = prefix.match(/(?:\+?91)?([6-9]\d{9})/);
        if (pMatch) {
          phoneDigits = pMatch[1];
        } else {
          contactName = prefix.replace(/^Call recording\s+/i, '').trim();
        }
      }
    } else if (vivoMatch) {
      deviceName = 'iQOO';
      const [_, prefix, yRaw, mm, dd, hh, min, ss] = vivoMatch;
      const yy = yRaw.length === 4 ? yRaw : `20${yRaw}`;
      yymmdd = `${yy}-${mm}-${dd}`;
      const sec = ss || '00';
      const d = new Date(`${yy}-${mm}-${dd}T${hh}:${min}:${sec}+05:30`);
      if (!isNaN(d.getTime())) isoTimestamp = d.toISOString();
      const mIdx = parseInt(mm, 10) - 1;
      const hInt = parseInt(hh, 10);
      const ampm = hInt >= 12 ? 'PM' : 'AM';
      const h12 = hInt % 12 || 12;
      formattedTime = `${parseInt(dd, 10)} ${months[mIdx]}, ${h12 < 10 ? '0' + h12 : h12}:${min} ${ampm}`;

      if (prefix) {
        const pMatch = prefix.match(/(?:\+?91)?([6-9]\d{9})/);
        if (pMatch) {
          phoneDigits = pMatch[1];
        } else {
          contactName = prefix.replace(/^Record[_-]/i, '').replace(/^Call recording\s+/i, '').trim();
        }
      }
    }

    if (!phoneDigits) {
      const anyPhone = name.match(/(?:\+?91)?([6-9]\d{9})/);
      if (anyPhone) phoneDigits = anyPhone[1];
    }

    // Check if KNOWN_DRIVE_MAPPINGS overrides
    if (typeof KNOWN_DRIVE_MAPPINGS !== 'undefined' && KNOWN_DRIVE_MAPPINGS[id]) {
      const km = KNOWN_DRIVE_MAPPINGS[id];
      if (km.name) contactName = km.name;
      const kmDigits = (km.phone || '').replace(/\D/g, '').slice(-10);
      if (kmDigits.length === 10) phoneDigits = kmDigits;
      if (km.time) formattedTime = km.time;
      if (km.device) deviceName = km.device;
    }

    const approxDuration = Math.max(10, Math.min(600, Math.round(size / 18000)));

    const finalDevice = (forcedDevice && forcedDevice !== 'Auto') ? forcedDevice : ((contactName.toLowerCase().includes('iqoo') || name.toLowerCase().includes('iqoo') || name.toLowerCase().includes('vivo')) ? 'iQOO' : deviceName);

    // Auto-resolve contactName to authentic phone digits if missing
    if (!phoneDigits && contactName) {
      const resolvedP = resolveContactNameToPhone(contactName);
      if (resolvedP) {
        const cleanD = resolvedP.replace(/\D/g, '').slice(-10);
        if (cleanD.length === 10) phoneDigits = cleanD;
      }
    }

    recordings.push({
      id,
      name,
      size,
      dateStr: yymmdd,
      formattedTime,
      phone: phoneDigits ? (`+91${phoneDigits}`) : '',
      phoneDigits,
      contactName,
      timestamp: isoTimestamp,
      audioUrl: `/api/call-audio?id=${id}`,
      approxDuration,
      deviceName: finalDevice,
      originFolderDevice: forcedDevice
    });
  });

  return recordings;
}

function deduplicateCalls(calls) {
  const deduped = [];
  const seenIds = new Set();
  const seenDriveIds = new Set();
  const seenFileBases = new Set();
  const seenPhoneTimes = new Map();
  const seenNameTimes = new Map();

  const MIRROR_DUPLICATES_TO_SKIP = new Set([
    '1L3svOsmB3Z2NDKry47XlrtqLr9kJPH92',
    '1WWzFE2Uhgl_FeFKpNbWIEjVnBBlg1Ag4',
    '1caf1BOZ9TO9Kc4WzpTyoZGFH_HzozeLP',
    '1VrsO6TX7uQecanxBUYzXhwLP-bgV1hxL',
    '1RHY2u2oT5xQdtrWxYxGe2dhXXVRcEI15',
    '1Ke-P02cvo9ClDNOa1tfnUaaM1eWGZEtH'
  ]);

  for (const c of calls) {
    if (!c || !c.id) continue;
    if (seenIds.has(c.id)) continue;

    const driveId = c.drive_file_id || (c.recording_url && c.recording_url.match(/id=([a-zA-Z0-9_-]{20,})/)?.[1]);
    if (driveId && MIRROR_DUPLICATES_TO_SKIP.has(driveId)) continue;
    if (c.id && Array.from(MIRROR_DUPLICATES_TO_SKIP).some(mid => c.id.includes(mid))) continue;

    if (driveId) {
      if (seenDriveIds.has(driveId)) continue;
      seenDriveIds.add(driveId);
    }

    const rawFile = c.recording_file_name || c.audio_file_name || c.file || '';
    if (rawFile) {
      const cleanBase = rawFile.replace(/\.(mp3|m4a|wav|aac|amr)$/i, '').trim().toLowerCase();
      if (cleanBase) {
        if (seenFileBases.has(cleanBase)) continue;
        seenFileBases.add(cleanBase);
      }
    }

    const d = new Date(c.date || c.timestamp || c.created_at);
    const timeMs = d.getTime();
    const phone = String(c.caller_number || c.phone || '').replace(/\D/g, '').slice(-10);
    const name = String(c.caller_name || c.leadName || '').trim().toLowerCase();

    if (phone && phone.length === 10 && !isNaN(timeMs)) {
      const existingList = seenPhoneTimes.get(phone) || [];
      const match = existingList.find(item => Math.abs(item.timeMs - timeMs) <= 180000);
      if (match) {
        if (c.hasAudio && !match.call.hasAudio) {
          match.call.recording_url = c.recording_url;
          match.call.audioUrl = c.audioUrl;
          match.call.drive_file_id = c.drive_file_id;
          match.call.hasAudio = true;
          match.call.duration = c.duration;
        }
        if (c.deviceName === 'iQOO' && match.call.deviceName !== 'iQOO') {
          match.call.deviceName = 'iQOO';
          match.call.device_name = 'iQOO';
          match.call.staff_name = 'iQOO';
        }
        continue;
      } else {
        existingList.push({ timeMs, call: c });
        seenPhoneTimes.set(phone, existingList);
      }
    }

    if (name && name !== 'direct phone call' && name !== 'customer call' && !name.includes('direct call') && !name.includes('customer') && !isNaN(timeMs)) {
      const existingList = seenNameTimes.get(name) || [];
      const match = existingList.find(item => Math.abs(item.timeMs - timeMs) <= 180000);
      if (match) {
        if (c.hasAudio && !match.call.hasAudio) {
          match.call.recording_url = c.recording_url;
          match.call.audioUrl = c.audioUrl;
          match.call.drive_file_id = c.drive_file_id;
          match.call.hasAudio = true;
          match.call.duration = c.duration;
        }
        continue;
      } else {
        existingList.push({ timeMs, call: c });
        seenNameTimes.set(name, existingList);
      }
    }

    seenIds.add(c.id);
    deduped.push(c);
  }
  return deduped;
}

function sendResponse(res, statusCode, data) {
  if (res.status && typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const explicitFolder = parsedUrl.query.folderId;
  const nowMs = Date.now();
  if (!parsedUrl.query.force && _cachedSyncData && (nowMs - _cachedSyncTime < 25000)) {
    sendResponse(res, 200, _cachedSyncData);
    return;
  }

  const DEVICE_FOLDERS = [
    { id: '1OHR3g8GWBaVNAa7kB6aRdk-WYmCngWh_', device: 'OnePlus', name: 'OnePlus / Master Calls' },
    { id: '1w2jK16SCGJrNrk7D_UYTMljKD56oPG76', device: 'iQOO', name: 'iQOO Calls' },
    { id: '1OzA7eq26hscqssJcVhwlWXUOYUKp6k8c', device: 'Samsung Galaxy', name: 'Samsung Calls' }
  ];

  try {
    let driveRecs = [];
    if (explicitFolder && !explicitFolder.includes('1OHR3g8GWBaVNAa7kB6aRdk-WYmCngWh_')) {
      let fId = explicitFolder;
      const folderMatch = explicitFolder.match(/folders\/([A-Za-z0-9_-]{20,})/);
      if (folderMatch) fId = folderMatch[1];
      const html = await fetchDriveFolderHTML(fId);
      driveRecs = parseDriveRecordings(html);
    } else {
      const folderResults = await Promise.all(
        DEVICE_FOLDERS.map(async f => {
          try {
            const html = await fetchDriveFolderHTML(f.id);
            return parseDriveRecordings(html, f.device);
          } catch(e) {
            return [];
          }
        })
      );
      folderResults.forEach(recs => driveRecs.push(...recs));
    }

    let calls = [];
    try {
      if (fs.existsSync(CALL_LOGS_FILE)) {
        calls = JSON.parse(fs.readFileSync(CALL_LOGS_FILE, 'utf8'));
      }
    } catch(e) {
      calls = [];
    }

    if (!calls || calls.length === 0) {
      const bundledPath = path.join(__dirname, '..', 'call_logs.json');
      if (fs.existsSync(bundledPath)) {
        try {
          calls = JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
        } catch(e) {}
      }
    }

    const seenFileNames = new Map();
    driveRecs.forEach(r => {
      const cleanName = (r.name || '').trim();
      if (!cleanName) return;

      const isSamsungFormat = cleanName.match(/^Call recording\s+/i);

      if (r.originFolderDevice === 'iQOO' || r.deviceName === 'iQOO') {
        r.deviceName = 'iQOO';
      } else if (r.originFolderDevice === 'Samsung Galaxy' || isSamsungFormat) {
        r.deviceName = 'Samsung Galaxy';
      } else if (r.originFolderDevice === 'OnePlus' || r.deviceName === 'OnePlus') {
        r.deviceName = 'OnePlus';
      } else {
        r.deviceName = r.deviceName || 'OnePlus';
      }

      if (seenFileNames.has(cleanName)) {
        if (r.originFolderDevice === 'iQOO') {
          seenFileNames.set(cleanName, r);
        }
      } else {
        seenFileNames.set(cleanName, r);
      }
    });

    const uniqueRecs = Array.from(seenFileNames.values());

    let attachedCount = 0;
    const CUTOFF_DATE = 0; // No cutoff date: all historical recordings preserved

    uniqueRecs.forEach(rec => {
      let matchedCall = calls.find(c => c.drive_file_id === rec.id || (c.recording_url && c.recording_url.includes(rec.id)));

      if (!matchedCall && rec.phoneDigits && rec.phoneDigits.length === 10) {
        matchedCall = calls.find(c => {
          if (c.drive_file_id && c.drive_file_id !== rec.id) return false;
          if (c.hasAudio && c.drive_file_id !== rec.id) return false;
          const cNum = String(c.caller_number || c.phone || '').replace(/\D/g, '').slice(-10);
          if (cNum !== rec.phoneDigits) return false;
          if (rec.timestamp && (c.created_at || c.timestamp || c.time)) {
            const recTime = new Date(rec.timestamp).getTime();
            const callTime = new Date(c.created_at || c.timestamp || c.time).getTime();
            return Math.abs(recTime - callTime) <= 180000; // Strict 3-minute physical call pairing window
          }
          return false;
        });
      }

      if (!matchedCall && rec.contactName) {
        const cleanRecName = rec.contactName.toLowerCase().trim();
        if (cleanRecName.length >= 3 && cleanRecName !== 'direct phone call') {
          matchedCall = calls.find(c => {
            if (c.drive_file_id && c.drive_file_id !== rec.id) return false;
            if (c.hasAudio && c.drive_file_id !== rec.id) return false;
            const nameC = (c.caller_name || c.leadName || '').toLowerCase().trim();
            if (nameC !== cleanRecName) return false;
            if (rec.timestamp && (c.created_at || c.timestamp || c.time)) {
              const recTime = new Date(rec.timestamp).getTime();
              const cTime = new Date(c.created_at || c.timestamp || c.time).getTime();
              return Math.abs(recTime - cTime) <= 180000; // Strict 3-minute physical call pairing window
            }
            return false;
          });
        }
      }

      // Blind 15-minute timestamp matching removed to prevent cross-customer audio contamination

      if (matchedCall) {
        if (!matchedCall.direction || matchedCall.direction === 'INBOUND') {
          if (KNOWN_DRIVE_MAPPINGS[rec.id] && KNOWN_DRIVE_MAPPINGS[rec.id].dir) {
            matchedCall.direction = KNOWN_DRIVE_MAPPINGS[rec.id].dir;
            matchedCall.call_type = KNOWN_DRIVE_MAPPINGS[rec.id].dir;
          }
        }
        if (!matchedCall.recording_url || matchedCall.recording_url.includes('UklGRuRdAABX')) {
          matchedCall.recording_url = rec.audioUrl;
          matchedCall.audioUrl = rec.audioUrl;
          matchedCall.drive_file_id = rec.id;
          matchedCall.hasAudio = true;
          matchedCall.outcome = 'Connected';
          matchedCall.call_outcome = 'Connected';
          matchedCall.callOutcome = 'Connected';
          if (!matchedCall.duration || matchedCall.duration === 0) {
            matchedCall.duration = rec.approxDuration;
          }
          if (rec.contactName && (!matchedCall.caller_name || matchedCall.caller_name === 'Direct Phone Call')) {
            matchedCall.caller_name = rec.contactName;
            matchedCall.leadName = rec.contactName;
          }
          const existingDev = String(matchedCall.deviceName || matchedCall.device_name || matchedCall.staff_name || '').toLowerCase();
          if (existingDev.includes('iq') || existingDev.includes('vivo')) {
            matchedCall.deviceName = 'iQOO';
            matchedCall.device_name = 'iQOO';
            matchedCall.staff_name = 'iQOO';
          } else if (existingDev.includes('samsung')) {
            matchedCall.deviceName = 'Samsung Galaxy';
            matchedCall.device_name = 'Samsung Galaxy';
            matchedCall.staff_name = 'Samsung Galaxy';
          } else if (rec.deviceName) {
            matchedCall.deviceName = rec.deviceName;
            matchedCall.device_name = rec.deviceName;
            matchedCall.staff_name = rec.deviceName;
          }
          attachedCount++;
        }
      } else if (rec.timestamp) {
        const recTime = new Date(rec.timestamp).getTime();
        if (recTime >= CUTOFF_DATE) {
          const isOnePlus = rec.deviceName === 'OnePlus';
          const cName = rec.contactName || (rec.phoneDigits ? 'Direct Phone Call' : (isOnePlus ? 'OnePlus Call (' + (rec.formattedTime || 'Recent') + ')' : 'Direct Customer Call'));
          let resolvedPhone = rec.phone || resolveContactNameToPhone(rec.contactName || rec.name) || "";
          let cNum = (resolvedPhone && /\d{7,}/.test(resolvedPhone)) ? resolvedPhone : ((rec.phoneDigits && rec.phoneDigits.length === 10) ? ('+91' + rec.phoneDigits) : (resolveContactNameToPhone(rec.contactName) || ''));
          const isOutbound = /out|outgoing|dialed/i.test(rec.name || '') || /outbound/i.test(rec.direction || '') || !!(KNOWN_DRIVE_MAPPINGS[rec.id] && KNOWN_DRIVE_MAPPINGS[rec.id].dir === 'OUTBOUND');
          const callDir = (KNOWN_DRIVE_MAPPINGS[rec.id] && KNOWN_DRIVE_MAPPINGS[rec.id].dir) || (isOutbound ? 'OUTBOUND' : (rec.direction || 'INBOUND'));
          const devName = rec.deviceName || (isOnePlus ? 'OnePlus' : (rec.originFolderDevice || 'Samsung Galaxy'));
          const newCall = {
            id: `call-rec-${rec.id}`,
            caller_number: cNum,
            phone: cNum,
            caller_name: cName,
            leadName: cName,
            call_type: callDir,
            direction: callDir,
            outcome: 'Connected',
            call_outcome: 'Connected',
            callOutcome: 'Connected',
            duration: rec.approxDuration,
            call_duration: rec.approxDuration,
            created_at: rec.timestamp,
            timestamp: rec.timestamp,
            time: rec.formattedTime,
            recording_url: rec.audioUrl,
            audioUrl: rec.audioUrl,
            hasAudio: true,
            drive_file_id: rec.id,
            deviceName: devName,
            device_name: devName,
            staff_name: devName,
            lead_id: '',
            leadId: '',
            ai_summary: '',
            aiSummary: '',
            transcript: ''
          };
          calls.unshift(newCall);
          attachedCount++;
        }
      }
    });

    const dedupedCalls = deduplicateCalls(calls);

    dedupedCalls.forEach(c => {
      const curNum = c.caller_number || c.phone || '';
      if (!curNum || !/\d{5,}/.test(curNum) || curNum.includes('Direct Call') || curNum.includes('Direct Phone') || !curNum.includes('+91')) {
        const resolvedP = resolveContactNameToPhone(c.caller_name || c.leadName);
        if (resolvedP) {
          c.caller_number = resolvedP;
          c.phone = resolvedP;
        } else if (curNum.includes('Direct Call')) {
          c.caller_number = c.caller_name || 'Customer';
          c.phone = c.caller_name || 'Customer';
        }
      }
      // Ensure Chetan Gumber is always INBOUND
      if (c.id === 'call-rec-1dpRMXa_ZIYTzHGxFb-M6Sljwuoz0w1Sy') {
        c.direction = 'INBOUND';
        c.call_type = 'INBOUND';
      }
    });

    try {
      fs.writeFileSync(CALL_LOGS_FILE, JSON.stringify(dedupedCalls, null, 2), 'utf8');
    } catch(e) {}

    _cachedSyncTime = Date.now();
    _cachedSyncData = {
      success: true,
      folderId: explicitFolder || DEFAULT_FOLDER_ID,
      driveFilesCount: driveRecs.length,
      attachedCount,
      calls: dedupedCalls
    };
    return sendResponse(res, 200, _cachedSyncData);
  } catch(err) {
    console.error('sync-recordings error:', err);
    return sendResponse(res, 500, { success: false, error: err.message });
  }
};
