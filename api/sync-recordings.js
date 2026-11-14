const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let _cachedSyncData = null;
let _cachedSyncTime = 0;
let _cachedFsRecentCalls = [];
let _cachedFsRecentTime = 0;

function getRecentFirestoreCallsSafe(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && _cachedFsRecentCalls.length > 0 && (now - _cachedFsRecentTime) < 120000) {
    return Promise.resolve(_cachedFsRecentCalls);
  }
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'call_logs' }],
        orderBy: [{ field: { fieldPath: 'created_at' }, direction: 'DESCENDING' }],
        limit: 300
      }
    });
    const req = https.request('https://firestore.googleapis.com/v1/projects/crm-f4bf7/databases/(default)/documents:runQuery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 6000
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return resolve(_cachedFsRecentCalls);
        }
        try {
          const parsed = JSON.parse(d);
          if (!Array.isArray(parsed)) return resolve(_cachedFsRecentCalls);
          const logs = parsed.filter(item => item.document && item.document.fields).map(item => {
            const f = item.document.fields;
            const rawDurVal = f.call_duration?.stringValue || f.call_duration?.integerValue || f.duration?.stringValue || f.duration?.integerValue || 0;
            const dur = parseInt(rawDurVal, 10) || 0;
            const rec = f.recording_url?.stringValue || f.audioUrl?.stringValue || '';
            const did = f.drive_file_id?.stringValue || (rec.match(/id=([a-zA-Z0-9_-]{20,})/)?.[1] || '');
            return {
              id: f.id?.stringValue || item.document.name.split('/').pop(),
              lead_id: f.lead_id?.stringValue || '',
              caller_number: f.caller_number?.stringValue || f.phone?.stringValue || '',
              phone: f.phone?.stringValue || f.caller_number?.stringValue || '',
              caller_name: f.caller_name?.stringValue || '',
              leadName: f.caller_name?.stringValue || '',
              receiver_number: f.receiver_number?.stringValue || '',
              call_duration: dur,
              duration: dur,
              recording_url: rec,
              audioUrl: rec,
              drive_file_id: did,
              recording_file_name: f.recording_file_name?.stringValue || '',
              hasAudio: !!(rec && rec.length > 10),
              ai_summary: f.ai_summary?.stringValue || '',
              direction: f.direction?.stringValue || 'INBOUND',
              call_type: f.direction?.stringValue || 'INBOUND',
              call_outcome: f.call_outcome?.stringValue || (dur > 0 || rec ? 'Connected' : 'Missed Call'),
              outcome: f.call_outcome?.stringValue || (dur > 0 || rec ? 'Connected' : 'Missed Call'),
              staff_name: f.staff_name?.stringValue || f.device_name?.stringValue || 'OnePlus',
              device_name: f.device_name?.stringValue || f.staff_name?.stringValue || 'OnePlus',
              deviceName: f.device_name?.stringValue || f.staff_name?.stringValue || 'OnePlus',
              created_at: f.created_at?.stringValue || '',
              timestamp: f.created_at?.stringValue || ''
            };
          });
          _cachedFsRecentCalls = logs;
          _cachedFsRecentTime = Date.now();
          resolve(logs);
        } catch(e) {
          resolve(_cachedFsRecentCalls);
        }
      });
    });
    req.on('error', () => resolve(_cachedFsRecentCalls));
    req.on('timeout', () => { req.destroy(); resolve(_cachedFsRecentCalls); });
    req.write(postData);
    req.end();
  });
}

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
  "mayur kheda": "+918054429147",
  "mayur kheda thekedar": "+918054429147",
  "monu thekedar": "+917986012851",
  "munna thekedar": "+919814941693",
  "sukhpreet sngh": "+918847684640",
  "sukhpreet singh": "+918847684640",
  "partap thekedar": "+917717273944",
  "jagtar singh thekedar": "+919517906829",
  "jagtar jagdev": "+919781915721",
  "anwarul khan": "+917357441912",
  "anwarul sir": "+917357441912",
  "anwarul sir plywood": "+917357441912",
  "renu kapoor": "+919876859703",
  "aliakabar ansari": "+919463206145",
  "carpanter rambabu": "+918729083796",
  "rambabu kumar": "+918729083796",
  "jassa singh marbella": "+917009602488",
  "jassa singh": "+917009602488",
  "jagjit singh": "+919779800140",
  "jagjit 3034": "+919779800140",
  "karnail singh": "+919501036231",
  "varun sec 82": "+918699391895",
  "varun kumar": "+918699391895",
  "sunil 144": "+919888800559",
  "sunil kumar": "+919216407728",
  "nirey plywood": "+919779122990",
  "pawan thekedar": "+917837740503",
  "aman 1615": "+919814066342",
  "flipkart": "+9118002029898",
  "flipkart customer service": "+9118002029898",
  "emergency number": "112",
  "parvinder dhiman": "+919501854050",
  "karan makhija": "+919417110526",
  "vijayalakshmy": "+918699555595",
  "vijayalakshmy r": "+918699555595",
  "asha singh": "+919416336813",
  "mahesh tiwari": "+919914543333",
  "mr. parag ravish w": "+919812793309",
  "rahul pal": "+918146559158",
  "harwinder singh": "+919592239595",
  "sundar kumar": "+917015904292",
  "sahil sharma": "+919056279246",
  "amin chand": "+918707019675",
  "raj singh saroha": "+919810970800",
  "kriti sharma": "+919317561594",
  "mr. surinder singh w": "+918910459215",
  "mr baldev singh thekedar mohali w": "+918699253575",
  "deepika sood": "+917580013001",
  "z l mawlong": "+917085048482",
  "kuldeep singh": "+919855185075",
  "nawendu kumar jha": "+919780798550",
  "pankaj mohan": "+917056115511",
  "kamal chadha": "+919888382543",
  "rajender s bedi": "+919814302105",
  "akshay sardana": "+919988205800",
  "mr. akram, gmb": "+919870007886",
  "zubair thekedar mohali": "+918146278532",
  "infinium doors & windows r": "+919817666664",
  "anshumann bni": "+917529051800",
  "ajay sharma": "+919813840800",
  "ritesh kumar": "+918894341115",
  "manpreet singh": "+919845634151",
  "harsh tuli": "+919888885002",
  "devinder kumar": "+918219104443",
  "shadi sharma": "+917042614964",
  "naveen garg": "+919416035687",
  "m r puri": "+919780034968",
  "mr. vikram mohi khurda w": "+918437816715",
  "mr. ricky aerocity": "+918800634333",
  "mr. gurpreet singh bni": "+917527055586",
  "gourav garg": "+917814849075",
  "narendra kumar sharma": "+919413330331",
  "rahul jain": "+919855556335",
  "avi handa": "+919780880484",
  "gurpreet singh": "+917527055586",
  "babu babusingh": "+919876571885",
  "rishi pal": "+919355783100",
  "amritpal singh": "+919417777743",
  "mr. anant": "+919815984006",
  "mr. vijay r": "+919815994778",
  "vijay shekhawat": "+919780850852",
  "mr. pawan kumar": "+917837740503",
  "aman badwal": "+917986698881",
  "ms. varinder kaur": "+918054301777",
  "ranbir singh enq gmb": "+919876400058",
  "mo malik": "+918650574618",
  "suresh giri goswami": "+917889232706",
  "mukesh kumar": "+919781385067",
  "rajesh kumar": "+917207220620",
  "manjinder kalsi": "+919056386554",
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
  "jaswinder singh badwal": "+918699440444",
  "vikas sharma": "+919653363858",
  "dhiraj kumar gupta": "+918262020986",
  "wood work contrater": "+916397258831",
  "pankaj gmb": "+918288857719",
  "deep katoch": "+917018153152",
  "aman kirpal": "+919876522285",
  "dheeraj grover": "+919814127823",
  "gurmony singh": "+919915134413",
  "ajit kumar": "+919534231148",
  "gaurav gandhi": "+919034099105",
  "ravindra rathee": "+919416300581",
  "janardhansharma5008": "+917458852977",
  "rajkamal gandhi": "+919816428880",
  "paramjit singh": "+919814203886",
  "neha ji hw": "+919815984329",
  "sanjay sood": "+919888000391",
  "ram kumar": "+919463019310",
  "kailash singh": "+919988993402",
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
  "gurmail thekedar": "+919855156161",
  "meenu badhwar": "+919216712787",
  "nachhattar singh": "+919417117300",
  "jaspreet singh narang": "+919876938088",
  "luxman singh": "+919050940350",
  "vijay bahadur": "+917696552200",
  "u d singh": "+919815970203",
  "dinesh kumar": "+917988695768",
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
  "mr. surjeet": "+918968847226",
  "shilpa pathak": "+919876764720",
  "pawan kumar": "+917837740503",
  "ms. jasnoor gmb": "+919306461334",
  "vikram gupta": "+919812043734",
  "yogeshchd@rediffmail.com": "+919815717739",
  "mr. pavitar singh grewal": "+917888737518",
  "pavitar singh grewal": "+917888737518",
  "harvinder kumar": "+919805730626",
  "mr. rajesh w": "+919814111536",
  "inderesh kumar": "+919888810998",
  "aakriti bhatt": "+919814606740",
  "ajay singh rana": "+917018629523",
  "aman rupal": "+919815928229",
  "सुभाष रघुवंशी": "+918219860971",
  "masti with khushi": "+918826750958",
  "sahil vashisht": "+919780020307",
  "mr. kant mandi simla": "+918894892235",
  "varinder miglani": "+919814466788",
  "rahul kataria": "+917696219355",
  "gurdeep singh enq online": "+916284255137",
  "jatinder singh": "+918699423766",
  "jay shri ram": "+919780595209",
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
  "rajeev garg": "+919729250246",
  "rahul bansal": "+919555954849",
  "amarjeet kaur": "+918360042131",
  "manish kumar": "+919779980836",
  "saurabh sharma gmb": "+917508256531",
  "naman gmb": "+919417807907",
  "mr. ashwani bhardwaj": "+919465373633",
  "jasnoor interior designer": "+919306461334",
  "sanjeev varshney": "+919815717361",
  "sumit gmb": "+918708960692",
  "mona gmb mitesh mlp galleria": "+918800760728",
  "gagana btauli": "+918427795395",
  "gurcharan singh": "+919466077700",
  "kant hingorani": "+919816509682",
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
  "mr. devender": "+919530723238",
  "deepak panwar": "+919459024363",
  "mr. arvind": "+919416583677",
  "daksh arora": "+919816502727",
  "krishna mohan test": "+916591002242",
  "sanjeev thakur": "+919971657598",
  "nikhil rajput": "+917807338154",
  "rajesh garg": "+919896670336",
  "priyanka sonker": "+917814941639",
  "deepak yongma": "+917018503126",
  "ravinder gupta": "+919418492666",
  "priyanka rana": "+917206220489",
  "krishna test": "+918950281868",
  "mo irfan": "+917895188821",
  "ramesh sharma": "+919418211206",
  "poonam (harvinder)": "+919888810811",
  "shakuntla devi": "+919872019485",
  "mr. surinder singh (w)": "+918910459215",
  "dispatch np": "+919877271849",
  "kiranjot singh": "+919872412345",
  "harpreet singh": "+919877142366",
  "kulwant singh": "+919814421127",
  "rajni bhat": "+919876521035",
  "eshan gaur": "+919814120340",
  "monu kitchen": "+916280251494",
  "monu kitchen np": "+916280251494",
  "parminder singh": "+918558055750",
  "sushil kumar": "+919815045731",
  "dinesh highland": "+917988695768",
  "dinesh highland hn no 9": "+917988695768",
  "jagjeevan gmb": "+919815045732",
  "jagjeevan gmb mohali": "+919815045732",
  "nikhil mishra": "+919151610556",
  "tushar sharma": "+919501653648",
  "suresh chand": "+919876754841",
  "rajni rani singla": "+919877865282",
  "sukhwinder singh": "+917814304573",
  "asam ali": "+916284538873",
  "satpal singh": "+917015920657",
  "mohan bni": "+919803353372",
  "mohan bni id 17": "+919803353372",
  "megha kumari": "+917503238194",
  "ranjeet kaur": "+919915911009",
  "parag ravish": "+919877808859",
  "shiv charan": "+919814015003",
  "rupinder singh": "+917508648100",
  "manga khan": "+919878685521",
  "jaimal singh": "+919814017001",
  "shweta malik": "+919814804391",
  "fakir chand": "+919463913526",
  "akash gupta ambala": "+919034236263",
  "akshay bhatnagar": "+918287589854",
  "sanju sir plywoods": "+919888722303",
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
  "mrs. surinder khatri (gmb)": "+919438370510",
  "mona gmb (mitesh mlp galleria)": "+918800760728",
  "mr.dilpreet singh(m)": "+919914093335",
  "krishna mohan - test": "+916591002242",
  "sachin digital marketing interview": "+917814435761"
};

function resolveContactNameToPhone(contactName) {
  if (!contactName) return '';
  const cleanRaw = String(contactName)
    .replace(/\([^)]*(?:spam|fraud|alert|jio)[^)]*\)/gi, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, ' ');
  const str = cleanRaw.toLowerCase().replace(/[\(\)\-\_]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!str || str === 'direct phone call' || str === 'direct customer call' || str === 'customer call' || /^\+?[\d\s()-]{6,}$/.test(str)) return '';
  if (KNOWN_CONTACT_PHONES[str]) return KNOWN_CONTACT_PHONES[str];
  const normalizedStr = str.replace(/[^a-z0-9]/g, '');
  if (normalizedStr) {
    for (const [k, p] of Object.entries(KNOWN_CONTACT_PHONES)) {
      const normalizedKey = k.replace(/[^a-z0-9]/g, '');
      if (normalizedStr === normalizedKey) return p;
    }
  }
  return '';
}
const KNOWN_DRIVE_MAPPINGS = {
  "1kEXZhk0_hNZO73IoWcXysD4EmIH__-ZY": { "name": "Direct Phone Call", "phone": "+917696013856", "dur": 45, "time": "6 Nov, 04:48 PM", "device": "OnePlus", "dir": "INBOUND", "file": "+917696013856-2611061648.mp3" },
  "1nXiA0L0TWdnhnkEwU0JaUmXe8tytCMha": { "name": "Eaklovya Chawla", "phone": "+919041444415", "dur": 45, "time": "6 Nov, 03:42 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Eaklovya Chawla-2611061542.mp3" },
  "1LLWmAfmRqAEN7lfFKfzhgj81foxHNpPI": { "name": "Simran Ssp", "phone": "+916239089562", "dur": 45, "time": "6 Nov, 03:21 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Simran Ssp-2611061521.mp3" },
  "1WqPZk3XWZhM79sSHVd3yoL9huIGdbgi3": { "name": "Manjit Singh", "phone": "+918557011635", "dur": 45, "time": "6 Nov, 03:16 PM", "device": "OnePlus", "dir": "INBOUND", "file": "8557011635-2611061516.mp3" },
  "1OcJAyBcng6ZqoajEUG_nbHUuYGYNeKvZ": { "name": "Manjit Singh", "phone": "+918557011635", "dur": 45, "time": "6 Nov, 03:14 PM", "device": "OnePlus", "dir": "INBOUND", "file": "8557011635-2611061514.mp3" },
  "1THMn-UJt9_NQkuJHtX3CKlSBhGAkn7Ye": { "name": "Dispatch Np", "phone": "+919877271849", "dur": 45, "time": "6 Nov, 01:44 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Dispatch Np-2611061344.mp3" },
  "1vaV9obaubEhvUGbMPHhjU6P8_t7EyUBa": { "name": "Dispatch Np", "phone": "+919877271849", "dur": 45, "time": "6 Nov, 01:16 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Dispatch Np-2611061316.mp3" },
  "1MrHgOcUlZU5qv3Le2-xncQGUYRvBOHQR": { "name": "Dispatch Np", "phone": "+919877271849", "dur": 45, "time": "6 Nov, 11:45 AM", "device": "OnePlus", "dir": "INBOUND", "file": "Dispatch Np-2611061145.mp3" },
  "1zb89USnVvWzzpPgRFGR8pZvvQ5HBzSZo": { "name": "Shakuntla Devi", "phone": "+919872019485", "dur": 45, "time": "6 Nov, 11:29 AM", "device": "OnePlus", "dir": "INBOUND", "file": "Shakuntla Devi-2611061129.mp3" },
  "1RWJvm1zXCyqKNf2Gm_Ozneh8AcbvgBrF": { "name": "Direct Phone Call", "phone": "+918427761777", "dur": 45, "time": "6 Nov, 11:27 AM", "device": "OnePlus", "dir": "INBOUND", "file": "+918427761777-2611061127.mp3" },
  "1_kF0SwikhBib9iJSqhxkAfN9EDUsB2m8": { "name": "Sahil", "phone": "", "dur": 28, "time": "6 Nov, 10:54 AM", "device": "OnePlus", "dir": "INBOUND", "file": "Sahil-2611061054.mp3" },
  "1--a2nAnc2gSjjZaVsZij8A4KBY2EumFz": { "name": "Surinder Kumar", "phone": "", "dur": 28, "time": "5 Nov, 06:29 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Surinder Kumar-2611051829.mp3" },
  "1dpRMXa_ZIYTzHGxFb-M6Sljwuoz0w1Sy": { "name": "Chetan Gumber", "phone": "+919814628661", "dur": 45, "time": "05 Nov, 05:04 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Chetan Gumber-2611051704.mp3" },
  "1LHCu17VhfALSe97YgZTv7MfUAn2hjmMS": { "name": "KIRANJOT SINGH", "phone": "+919872412345", "dur": 39, "time": "5 Nov, 02:56 PM", "device": "OnePlus", "dir": "INBOUND", "file": "KIRANJOT SINGH-2611051456.mp3" },
  "1on8TzhkXrnG2F-K8fA6SY9srlnNZSCpE": { "name": "Direct Phone Call", "phone": "+917942748821", "dur": 26, "time": "05 Nov, 01:38 PM", "device": "OnePlus", "dir": "INBOUND", "file": "+917942748821-2611051337.mp3" },
  "1HcI8qnsAsO4PmSvl9YVbD3pgQUSgU69e": { "name": "Direct Phone Call", "phone": "+918427761777", "dur": 225, "time": "05 Nov, 01:35 PM", "device": "OnePlus", "dir": "INBOUND", "file": "+918427761777-2611051332.mp3" },
  "1v6HE2E6CufBnzsJ9oBdmgjxJ_dCNHrvN": { "name": "Direct Phone Call", "phone": "+919466609171", "dur": 42, "time": "05 Nov, 01:21 PM", "device": "OnePlus", "dir": "INBOUND", "file": "9466609171-2611051320.mp3" },
  "1sAcuoUO6hJhFQIi0r8SGLOYnxwA-YLMa": { "name": "AKSHAY BHATNAGAR", "phone": "+918287589854", "dur": 51, "time": "05 Nov, 01:30 PM", "device": "OnePlus", "dir": "INBOUND", "file": "AKSHAY BHATNAGAR-2611051329.mp3" },
  "12oZbi1MQ5TTcwimtmJU69f_bHvmjUB51": { "name": "Akash Gupta Ambala", "phone": "+919034236263", "dur": 34, "time": "05 Nov, 12:54 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Akash Gupta Ambala-2611051253.mp3" },
  "1fDK3IyrKMBBa8CgqBfzT7MzKROp3mivN": { "name": "Fakir Chand", "phone": "+919463913526", "dur": 73, "time": "05 Nov, 12:33 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Fakir Chand-2611051232.mp3" },
  "1AzDIMD3Y961_qeeWC53TglNKM_ILQphF": { "name": "( Spam Alert From Jio) Mazed Mallick", "phone": "+918293805138", "dur": 45, "time": "05 Nov, 12:13 PM", "device": "OnePlus", "dir": "INBOUND", "file": "( Spam Alert From Jio) Mazed Mallick-2611051213.mp3" },
  "1mDYWSyB2RMebaSiYYc6Uky4ne6TCWh4Q": { "name": "Poonam (Harvinder)", "phone": "+919888810811", "dur": 25, "time": "04 Nov, 02:45 PM", "device": "OnePlus", "dir": "INBOUND", "file": "POONAM-2611041445.mp3" },
  "1tPx5V2Fy0LoiehKmOzIpLbixxO9BtJiT": { "name": "Poonam (Harvinder)", "phone": "+919888810811", "dur": 30, "time": "04 Nov, 02:46 PM", "device": "OnePlus", "dir": "INBOUND", "file": "POONAM-2611041446.mp3" },
  "1jHNtG1sSzcYxrgEZMwu-rXRCFr0LwOB_": { "name": "PARMINDER SINGH", "phone": "+918558055750", "dur": 22, "time": "2 Nov, 05:12 PM", "device": "OnePlus", "dir": "INBOUND", "file": "PARMINDER SINGH-2611021712.mp3" },
  "1yXaNUei3OjuxgELlqKxydp85J0veX5nO": { "name": "Sushil Kumar", "phone": "+919815045731", "dur": 57, "time": "2 Nov, 04:50 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Sushil Kumar-2611021650.mp3" },
  "1Mq7sdU7WhnfjEPS13ieba0bNYdIw__in": { "name": "Shr", "phone": "+917015274682", "dur": 21, "time": "2 Nov, 04:46 PM", "device": "OnePlus", "dir": "OUTBOUND", "file": "Shr-2611021646.mp3" }
};

function fetchDriveFolderHTML(folderId, depth = 0) {
  return new Promise((resolve) => {
    let cleanId = String(folderId || '').trim();
    const fm = cleanId.match(/folders\/([A-Za-z0-9_-]{20,})/) || cleanId.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
    if (fm) cleanId = fm[1];
    cleanId = cleanId.split(/[?&#]/)[0].trim();
    if (!cleanId) return resolve('');
    const urlStr = 'https://drive.google.com/embeddedfolderview?id=' + encodeURIComponent(cleanId);
    const req = https.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 12000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && depth < 3) {
        res.resume();
        const nextReq = https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 12000 }, (r2) => {
          let d2 = '';
          r2.on('data', c => d2 += c);
          r2.on('end', () => resolve(d2));
        });
        nextReq.on('error', () => resolve(''));
        nextReq.on('timeout', () => { nextReq.destroy(); resolve(''); });
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

function parseDriveRecordings(html, forcedDevice = "Auto") {
  const recordings = [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const isAudioExt = (n) => /\.(m4a|mp3|wav|aac|amr|ogg|3gp|opus|mp4|awb)$/i.test(String(n || '').trim());

  // Method 1: Modern Google Drive flip-entry markup (captures lastModified too as timestamp fallback)
  const flipEntryBlockRegex = /<div class="flip-entry"[^>]*id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>(?:[\s\S]*?<div class="flip-entry-last-modified"><div>([^<]+)<\/div>)?/gi;
  let m;
  const rawItems = [];

  while ((m = flipEntryBlockRegex.exec(html)) !== null) {
    const id = m[1];
    const name = m[2].trim();
    const lastMod = (m[3] || '').trim();
    if (isAudioExt(name)) {
      rawItems.push({ id, name, size: 500000, lastMod });
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
            if (isAudioExt(name)) {
              rawItems.push({ id, name, size, lastMod: '' });
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

    // Pattern 1: Samsung Galaxy format: Call recording [Name/Number]_[YYMMDD|YYYYMMDD]_[HHMMSS].m4a
    const samsungMatch = name.match(/^Call recording\s+(.+?)_(\d{4}|\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.(m4a|mp3|aac|amr|wav|ogg|3gp|opus)$/i);
    // Pattern 2: Vivo / iQOO / 4-digit year format: Record_[Prefix]_[YYYYMMDD|YYMMDD]_[HHMMSS] OR 8-digit date YYYYMMDD
    const vivoOrIsoMatch = name.match(/^(?:Record[_-])?(?:(.+?)[_-])?(\d{4})[-_]?(\d{2})[-_]?(\d{2})[_-]?(\d{2})(\d{2})(\d{2})?\.(aac|amr|mp3|m4a|wav|ogg|3gp|opus)$/i) ||
                           name.match(/^(?:Record[_-])(?:(.+?)[_-])?(\d{2})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})?\.(aac|amr|mp3|m4a|wav|ogg|3gp|opus)$/i);
    // Pattern 3: OnePlus format: [Name/Number]-[YYMMDDHHMM].mp3
    const oneplusMatch = name.match(/^(?:(.+?)[_-])?(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\.(mp3|m4a|wav|aac|amr|ogg|3gp|opus)$/i);

    // Helper: extract 10-digit Indian phone even if spaced/hyphenated (+91 98765 43210 or 98765-43210)
    function extractDigitsFromText(txt) {
      if (!txt) return '';
      const compact = String(txt).replace(/(?<=\d)[\s-]+(?=\d)/g, '');
      const m = compact.match(/(?:\+?91)?([6-9]\d{9})/);
      return m ? m[1] : '';
    }

    if (samsungMatch) {
      deviceName = 'Samsung Galaxy';
      const [_, prefix, yRaw, mm, dd, hh, min, ss] = samsungMatch;
      const yyyy = yRaw.length === 4 ? yRaw : `20${yRaw}`;
      yymmdd = `${yyyy}-${mm}-${dd}`;
      const d = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`);
      if (!isNaN(d.getTime())) isoTimestamp = d.toISOString();
      const mIdx = parseInt(mm, 10) - 1;
      const hInt = parseInt(hh, 10);
      const ampm = hInt >= 12 ? 'PM' : 'AM';
      const h12 = hInt % 12 || 12;
      formattedTime = `${parseInt(dd, 10)} ${months[mIdx]}, ${h12 < 10 ? '0' + h12 : h12}:${min} ${ampm}`;

      phoneDigits = extractDigitsFromText(prefix);
      if (!phoneDigits) contactName = prefix.trim();
    } else if (vivoOrIsoMatch) {
      deviceName = /\.(m4a)$/i.test(name) ? 'Samsung Galaxy' : 'iQOO';
      const [_, prefix, yRaw, mm, dd, hh, min, ss] = vivoOrIsoMatch;
      const yyyy = yRaw.length === 4 ? yRaw : `20${yRaw}`;
      yymmdd = `${yyyy}-${mm}-${dd}`;
      const sec = ss || '00';
      const d = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}+05:30`);
      if (!isNaN(d.getTime())) isoTimestamp = d.toISOString();
      const mIdx = parseInt(mm, 10) - 1;
      const hInt = parseInt(hh, 10);
      const ampm = hInt >= 12 ? 'PM' : 'AM';
      const h12 = hInt % 12 || 12;
      formattedTime = `${parseInt(dd, 10)} ${months[mIdx]}, ${h12 < 10 ? '0' + h12 : h12}:${min} ${ampm}`;

      if (prefix) {
        phoneDigits = extractDigitsFromText(prefix);
        if (!phoneDigits) contactName = prefix.replace(/^Record[_-]/i, '').replace(/^Call recording\s+/i, '').trim();
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
        phoneDigits = extractDigitsFromText(prefix);
        if (!phoneDigits) contactName = prefix.replace(/^Call recording\s+/i, '').trim();
      }
    }

    if (!isoTimestamp && it.lastMod) {
      const lm = new Date(it.lastMod + (/\b20\d{2}\b/.test(it.lastMod) ? '' : ' 2026'));
      if (!isNaN(lm.getTime())) {
        isoTimestamp = lm.toISOString();
        yymmdd = isoTimestamp.slice(0, 10);
        formattedTime = it.lastMod;
      }
    }

    if (!phoneDigits) {
      phoneDigits = extractDigitsFromText(name);
    }

    // Check if KNOWN_DRIVE_MAPPINGS overrides
    let mappedDevice = '';
    if (typeof KNOWN_DRIVE_MAPPINGS !== 'undefined' && KNOWN_DRIVE_MAPPINGS[id]) {
      const km = KNOWN_DRIVE_MAPPINGS[id];
      if (km.name) contactName = km.name;
      const kmDigits = (km.phone || '').replace(/\D/g, '').slice(-10);
      if (kmDigits.length === 10) phoneDigits = kmDigits;
      if (km.time) formattedTime = km.time;
      if (km.device) {
        deviceName = km.device;
        mappedDevice = km.device;
      }
    }

    const approxDuration = Math.max(10, Math.min(600, Math.round(size / 18000)));

    // Strict hardware filename detection prevents mirrored Drive folders (e.g. F2_IQOO containing Samsung .m4a or OnePlus .mp3) from hijacking device identity
    const isNativeSamsungFile = /^Call recording\s+/i.test(name) || /\.m4a$/i.test(name);
    const isNativeIqooFile = /^Record[_-]/i.test(name) || /\.(aac|amr|ogg)$/i.test(name) || name.toLowerCase().includes('iqoo') || name.toLowerCase().includes('vivo');
    let finalDevice = deviceName;
    if (mappedDevice) {
      finalDevice = mappedDevice;
    } else if (isNativeSamsungFile) {
      finalDevice = 'Samsung Galaxy';
    } else if (isNativeIqooFile || contactName.toLowerCase().includes('iqoo')) {
      finalDevice = 'iQOO';
    } else if (forcedDevice && forcedDevice !== 'Auto') {
      finalDevice = forcedDevice;
    }

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
      isNativeSamsungFile,
      isNativeIqooFile,
      mappedDevice,
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
    '1Ke-P02cvo9ClDNOa1tfnUaaM1eWGZEtH',
    '1RiCbH2xZIsrxO_FwJpOTI7UL2eQh_pO7',
    '1guPVfglcsozw_fJ35z1qyv2ZvDg6LVZ7',
    '1dHNOi9XPt9T5oJrpvsEbV_AW4Kj7uQC4'
  ]);

  const TEST_PHONES_TO_SKIP = new Set(['9999999999', '9999988888', '9876543210', '9876543211', '9876543299', '9999900001', '9988776655', '9876500001']);
  const isSyntheticTestRecord = (c) => {
    const cid = String(c.id || '').trim().toLowerCase();
    if (cid === 'test-123') return true;
    const p10 = String(c.caller_number || c.phone || '').replace(/\D/g, '').slice(-10);
    const nm = String(c.caller_name || c.leadName || '').trim().toLowerCase();
    const dev = String(c.deviceName || c.device_name || '');
    if (TEST_PHONES_TO_SKIP.has(p10)) return true;
    if (/^(test\s*customer|testprobe|livetestcheck|live\s*iqoo\s*test|iqoo\s*test\s*connection|test\s*unpicked\s*lead|test\s*outbound\s*lead|caller\s*(?:one|two)|unknown\s*dev)/i.test(nm)) return true;
    return false;
  };

  for (const c of calls) {
    if (!c || !c.id) continue;
    if (isSyntheticTestRecord(c)) continue;
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
      // Enforce format-authentic device assignment so mirrored/stale docs cannot stay on wrong device
      if (/^Call recording\s+/i.test(rawFile) || /\.m4a$/i.test(rawFile)) {
        c.deviceName = 'Samsung Galaxy';
        c.device_name = 'Samsung Galaxy';
        c.staff_name = 'Samsung Galaxy';
      } else if (/^Record[_-]/i.test(rawFile) || /\.(aac|amr|ogg)$/i.test(rawFile)) {
        c.deviceName = 'iQOO';
        c.device_name = 'iQOO';
        c.staff_name = 'iQOO';
      } else if (/\.mp3$/i.test(rawFile) && /samsung/i.test(String(c.deviceName || c.device_name || ''))) {
        c.deviceName = 'OnePlus';
        c.device_name = 'OnePlus';
        c.staff_name = 'OnePlus';
      }
      const cleanBase = rawFile.replace(/\.(mp3|m4a|wav|aac|amr)$/i, '').trim().toLowerCase();
      if (cleanBase && !/^(call_recording|recording|audio|voice|call|sound|unknown|untitled|record)$/i.test(cleanBase)) {
        if (seenFileBases.has(cleanBase)) continue;
        seenFileBases.add(cleanBase);
      }
    }

    const d = new Date(c.date || c.timestamp || c.created_at);
    const timeMs = d.getTime();
    const phone = String(c.caller_number || c.phone || '').replace(/\D/g, '').slice(-10);
    const name = String(c.caller_name || c.leadName || '').trim().toLowerCase();
    const devLower = String(c.deviceName || c.device_name || c.staff_name || '').toLowerCase();
    const devKey = devLower.includes('iq') || devLower.includes('vivo') ? 'iqoo' : (devLower.includes('samsung') ? 'samsung' : (devLower.includes('oneplus') || devLower.includes('one plus') ? 'oneplus' : 'other'));

    if (phone && phone.length === 10 && !isNaN(timeMs)) {
      const key = `${phone}|${devKey}`;
      const existingList = seenPhoneTimes.get(key) || [];
      const cDid = driveId || '';
      const cFileBase = rawFile ? rawFile.replace(/\.(mp3|m4a|wav|aac|amr|ogg|3gp|opus)$/i, '').trim().toLowerCase() : '';
      const match = existingList.find(item => {
        if (Math.abs(item.timeMs - timeMs) > 180000) return false;
        // Preserve distinct non-mirror Drive recordings even within 3 minutes
        const exDid = item.call.drive_file_id || '';
        const exRaw = item.call.recording_file_name || item.call.audio_file_name || item.call.file || '';
        const exBase = exRaw ? exRaw.replace(/\.(mp3|m4a|wav|aac|amr|ogg|3gp|opus)$/i, '').trim().toLowerCase() : '';
        if (cDid && exDid && cDid !== exDid && cFileBase && exBase && cFileBase !== exBase) return false;
        return true;
      });
      if (match) {
        if (c.hasAudio && !match.call.hasAudio) {
          match.call.recording_url = c.recording_url;
          match.call.audioUrl = c.audioUrl;
          match.call.drive_file_id = c.drive_file_id;
          match.call.recording_file_name = c.recording_file_name || match.call.recording_file_name;
          match.call.hasAudio = true;
          match.call.duration = c.duration;
        }
        continue;
      } else {
        existingList.push({ timeMs, call: c });
        seenPhoneTimes.set(key, existingList);
      }
    }

    if (name && name !== 'direct phone call' && name !== 'customer call' && !name.includes('direct call') && !name.includes('customer') && !isNaN(timeMs)) {
      const key = `${name}|${devKey}`;
      const existingList = seenNameTimes.get(key) || [];
      const cDid = driveId || '';
      const cFileBase = rawFile ? rawFile.replace(/\.(mp3|m4a|wav|aac|amr|ogg|3gp|opus)$/i, '').trim().toLowerCase() : '';
      const match = existingList.find(item => {
        if (Math.abs(item.timeMs - timeMs) > 180000) return false;
        const exDid = item.call.drive_file_id || '';
        const exRaw = item.call.recording_file_name || item.call.audio_file_name || item.call.file || '';
        const exBase = exRaw ? exRaw.replace(/\.(mp3|m4a|wav|aac|amr|ogg|3gp|opus)$/i, '').trim().toLowerCase() : '';
        if (cDid && exDid && cDid !== exDid && cFileBase && exBase && cFileBase !== exBase) return false;
        return true;
      });
      if (match) {
        if (c.hasAudio && !match.call.hasAudio) {
          match.call.recording_url = c.recording_url;
          match.call.audioUrl = c.audioUrl;
          match.call.drive_file_id = c.drive_file_id;
          match.call.recording_file_name = c.recording_file_name || match.call.recording_file_name;
          match.call.hasAudio = true;
          match.call.duration = c.duration;
        }
        continue;
      } else {
        existingList.push({ timeMs, call: c });
        seenNameTimes.set(key, existingList);
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
  let explicitFolder = String(parsedUrl.query.folderId || '').trim();
  const fmExp = explicitFolder.match(/folders\/([A-Za-z0-9_-]{20,})/) || explicitFolder.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
  if (fmExp) explicitFolder = fmExp[1];
  explicitFolder = explicitFolder.split(/[?&#]/)[0].trim();

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

  const foldersToScan = DEVICE_FOLDERS.slice();
  if (explicitFolder && !foldersToScan.some(f => f.id === explicitFolder)) {
    foldersToScan.push({ id: explicitFolder, device: 'Auto', name: 'Custom Drive Folder' });
  }

  try {
    let driveRecs = [];
    const folderResults = await Promise.all(
      foldersToScan.map(async f => {
        try {
          const html = await fetchDriveFolderHTML(f.id);
          return parseDriveRecordings(html, f.device);
        } catch(e) {
          return [];
        }
      })
    );
    folderResults.forEach(recs => driveRecs.push(...recs));

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

    // Merge recent live webhooks from Firestore (rate-limited, safe fallback on 429) so newly dialed/received calls get Drive audio attached
    try {
      const fsRecent = await getRecentFirestoreCallsSafe(!!parsedUrl.query.force);
      if (Array.isArray(fsRecent) && fsRecent.length > 0) {
        const callIds = new Set(calls.map(c => c && c.id).filter(Boolean));
        fsRecent.forEach(fc => {
          if (fc && fc.id && !callIds.has(fc.id)) {
            calls.unshift(fc);
            callIds.add(fc.id);
          }
        });
      }
    } catch(e) {}

    const normDevKey = (d) => {
      const s = String(d || '').toLowerCase().trim();
      if (s.includes('iq') || s.includes('vivo')) return 'iqoo';
      if (s.includes('samsung')) return 'samsung';
      return 'oneplus';
    };
    const canonicalDevName = (d) => {
      const k = normDevKey(d);
      if (k === 'iqoo') return 'iQOO';
      if (k === 'samsung') return 'Samsung Galaxy';
      return 'OnePlus';
    };

    // Deduplicate mirrored filenames across the 3 Drive folders in two passes:
    // Pass 1 records every folder containing a filename; Pass 2 assigns authentic device without F2_iQOO mirrors stealing Samsung (.m4a) or OnePlus (.mp3).
    const seenFileNames = new Map();
    driveRecs.forEach(r => {
      const cleanName = (r.name || '').trim();
      if (!cleanName) return;

      const isSamsungFormat = r.isNativeSamsungFile || /^Call recording\s+/i.test(cleanName) || /\.m4a$/i.test(cleanName);
      const isIqooFormat = r.isNativeIqooFile || /^Record[_-]/i.test(cleanName) || /\.(aac|amr|ogg)$/i.test(cleanName);

      const existing = seenFileNames.get(cleanName);
      if (!existing) {
        r._folders = new Set([r.originFolderDevice]);
        seenFileNames.set(cleanName, r);
      } else {
        existing._folders.add(r.originFolderDevice);
        // Prefer F3_SAMSUNG ID for Samsung .m4a, F1_ONEPLUS ID for OnePlus .mp3, and keep explicit KNOWN_DRIVE_MAPPINGS entry
        if (r.mappedDevice) {
          r._folders = existing._folders;
          seenFileNames.set(cleanName, r);
        } else if (isSamsungFormat && r.originFolderDevice === 'Samsung Galaxy') {
          r._folders = existing._folders;
          seenFileNames.set(cleanName, r);
        } else if (!isSamsungFormat && !isIqooFormat && r.originFolderDevice === 'OnePlus') {
          r._folders = existing._folders;
          seenFileNames.set(cleanName, r);
        } else if (isIqooFormat && r.originFolderDevice === 'iQOO') {
          r._folders = existing._folders;
          seenFileNames.set(cleanName, r);
        }
      }
    });

    const uniqueRecs = Array.from(seenFileNames.values());
    uniqueRecs.forEach(r => {
      const cleanName = (r.name || '').trim();
      const isSamsungFormat = r.isNativeSamsungFile || /^Call recording\s+/i.test(cleanName) || /\.m4a$/i.test(cleanName);
      const isIqooFormat = r.isNativeIqooFile || /^Record[_-]/i.test(cleanName) || /\.(aac|amr|ogg)$/i.test(cleanName);
      const folders = r._folders || new Set([r.originFolderDevice]);

      if (r.mappedDevice) {
        r.deviceName = canonicalDevName(r.mappedDevice);
      } else if (isSamsungFormat) {
        r.deviceName = 'Samsung Galaxy';
      } else if (isIqooFormat) {
        r.deviceName = 'iQOO';
      } else if (/\.mp3$/i.test(cleanName)) {
        // .mp3 belongs to OnePlus unless uploaded EXCLUSIVELY in F2_iQOO (never in F1_OnePlus or F3_Samsung)
        const onlyInIqooFolder = folders.has('iQOO') && !folders.has('OnePlus') && !folders.has('Samsung Galaxy');
        r.deviceName = onlyInIqooFolder ? 'iQOO' : 'OnePlus';
      } else {
        r.deviceName = canonicalDevName(r.deviceName || r.originFolderDevice || 'OnePlus');
      }
    });

    const recByDriveId = new Map(uniqueRecs.map(r => [r.id, r]));

    // Build strictly unambiguous contact-name -> 10-digit phone lookup from existing calls + normalize existing device names
    const dynamicPhoneByName = new Map();
    const ambiguousNames = new Set();
    const isRealContactNm = (nm) => nm && nm.length >= 3 && nm.includes(' ') &&
      !['direct phone call', 'customer call', 'direct call', 'direct customer call', 'potential fraud', 'suspected spam'].includes(nm) &&
      !nm.includes('spam') && !/^\+?[\d\s()-]+$/.test(nm);
    calls.forEach(c => {
      if (!c) return;
      c.deviceName = canonicalDevName(c.deviceName || c.device_name || c.staff_name);
      c.device_name = c.deviceName;
      c.staff_name = c.deviceName;
      const cDid = c.drive_file_id || (c.recording_url && c.recording_url.match(/id=([a-zA-Z0-9_-]{20,})/)?.[1]) || '';
      const fn = c.recording_file_name || c.audioFileName || c.file || '';
      if (/^Call recording\s+/i.test(fn) || /\.m4a$/i.test(fn)) {
        c.deviceName = 'Samsung Galaxy';
        c.device_name = 'Samsung Galaxy';
        c.staff_name = 'Samsung Galaxy';
      } else if (/^Record[_-]/i.test(fn) || /\.(aac|amr|ogg)$/i.test(fn)) {
        c.deviceName = 'iQOO';
        c.device_name = 'iQOO';
        c.staff_name = 'iQOO';
      } else if (cDid && recByDriveId.has(cDid)) {
        const matchedRec = recByDriveId.get(cDid);
        const recKey = normDevKey(matchedRec.deviceName);
        const callKey = normDevKey(c.deviceName);
        if (String(c.id || '').startsWith('call-log-') && recKey && callKey && recKey !== callKey) {
          // Stale cached webhook holding another device's audio: strip audio so it re-attaches to its true phone!
          c.recording_url = '';
          c.audioUrl = '';
          c.drive_file_id = '';
          c.recording_file_name = '';
          c.audioFileName = '';
          c.hasAudio = false;
        } else {
          c.deviceName = matchedRec.deviceName;
          c.device_name = matchedRec.deviceName;
          c.staff_name = matchedRec.deviceName;
        }
      } else if (/\.mp3$/i.test(fn) && normDevKey(c.deviceName) !== 'oneplus') {
        c.deviceName = 'OnePlus';
        c.device_name = 'OnePlus';
        c.staff_name = 'OnePlus';
      }
      const d10 = String(c.caller_number || c.phone || c.receiver_number || '').replace(/\D/g, '').slice(-10);
      const nm = String(c.caller_name || c.leadName || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
      if (d10.length === 10 && isRealContactNm(nm)) {
        if (dynamicPhoneByName.has(nm) && dynamicPhoneByName.get(nm) !== '+91' + d10) {
          ambiguousNames.add(nm);
        } else if (!ambiguousNames.has(nm)) {
          dynamicPhoneByName.set(nm, '+91' + d10);
        }
      }
    });
    ambiguousNames.forEach(nm => dynamicPhoneByName.delete(nm));

    let attachedCount = 0;
    const CUTOFF_DATE = 0;

    uniqueRecs.forEach(rec => {
      if (!rec.phoneDigits && rec.contactName) {
        const cleanNm = rec.contactName.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
        const dynP = dynamicPhoneByName.get(cleanNm);
        if (dynP) {
          rec.phone = dynP;
          rec.phoneDigits = dynP.slice(-10);
        }
      }
      const recDevKey = normDevKey(rec.deviceName);
      let matchedCall = calls.find(c => c.drive_file_id === rec.id || (c.recording_url && c.recording_url.includes(rec.id)));

      const matchesTimeWindow = (c, isExactPhone = false) => {
        if (!rec.timestamp || !(c.created_at || c.timestamp || c.time)) return isExactPhone;
        const recTime = new Date(rec.timestamp).getTime();
        const callTime = new Date(c.created_at || c.timestamp || c.time).getTime();
        if (isNaN(recTime) || isNaN(callTime)) return isExactPhone;
        const callDurMs = (parseInt(c.call_duration || c.duration || 0, 10) || 0) * 1000;
        const diffStart = Math.abs(recTime - (callTime - callDurMs));
        const diffEnd = Math.abs(recTime - callTime);
        const baseWindow = isExactPhone ? 7200000 : 300000;
        const maxDiff = Math.max(baseWindow, callDurMs + 600000);
        return diffStart <= maxDiff || diffEnd <= maxDiff;
      };

      const findCallByPhoneOrName = (requireSameDevice) => {
        if (rec.phoneDigits && rec.phoneDigits.length === 10) {
          const candidates = calls.filter(c => {
            if (c.drive_file_id && c.drive_file_id !== rec.id) return false;
            if (c.hasAudio && c.drive_file_id !== rec.id) return false;
            const cDevKey = normDevKey(c.deviceName || c.device_name || c.staff_name);
            if (cDevKey !== recDevKey) return false;
            const cNum = String(c.caller_number || c.phone || c.receiver_number || '').replace(/\D/g, '').slice(-10);
            if (cNum !== rec.phoneDigits) return false;
            return matchesTimeWindow(c, true);
          });
          if (candidates.length > 0) {
            const recTime = rec.timestamp ? new Date(rec.timestamp).getTime() : 0;
            candidates.sort((a, b) => {
              const aT = new Date(a.created_at || a.timestamp || a.time || 0).getTime();
              const bT = new Date(b.created_at || b.timestamp || b.time || 0).getTime();
              return Math.abs(recTime - aT) - Math.abs(recTime - bT);
            });
            return candidates[0];
          }
        }
        if (rec.contactName) {
          const cleanRecName = rec.contactName.toLowerCase().trim();
          const recHasPhone = !!(rec.phoneDigits && rec.phoneDigits.length === 10);
          if (cleanRecName.length >= 3 && cleanRecName !== 'direct phone call' && cleanRecName !== 'direct customer call' && cleanRecName !== 'customer call' && !/^\+?[\d\s()-]+$/.test(cleanRecName)) {
            return calls.find(c => {
              if (c.drive_file_id && c.drive_file_id !== rec.id) return false;
              if (c.hasAudio && c.drive_file_id !== rec.id) return false;
              const cDevKey = normDevKey(c.deviceName || c.device_name || c.staff_name);
              if (cDevKey !== recDevKey) return false;
              const cNum = String(c.caller_number || c.phone || c.receiver_number || '').replace(/\D/g, '').slice(-10);
              // Strict: if call has a 10-digit number and recording has no phone number, NEVER attach solely by contact name!
              if (cNum.length === 10 && !recHasPhone) return false;
              if (recHasPhone && cNum.length === 10 && cNum !== rec.phoneDigits) return false;
              const nameC = (c.caller_name || c.leadName || '').toLowerCase().trim();
              if (!nameC || nameC !== cleanRecName) return false;
              return matchesTimeWindow(c, false);
            });
          }
        }
        return null;
      };

      // Strict same-device recording matching only — never steal/attach one phone's audio onto another phone's webhook
      if (!matchedCall) matchedCall = findCallByPhoneOrName(true);

      if (matchedCall) {
        // Enforce phone conflict guard: NEVER attach if call has 10-digit phone and rec has different 10-digit phone
        const cPhone10 = String(matchedCall.phone || matchedCall.caller_number || matchedCall.receiver_number || '').replace(/\D/g, '').slice(-10);
        if (rec.phoneDigits && rec.phoneDigits.length === 10 && cPhone10 && cPhone10.length === 10 && rec.phoneDigits !== cPhone10) {
          // Conflicts! Do not attach!
          matchedCall = null;
        }
      }

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
          matchedCall.recording_file_name = rec.name;
          matchedCall.audioFileName = rec.name;
          matchedCall.hasAudio = true;
          matchedCall.outcome = 'Connected';
          matchedCall.call_outcome = 'Connected';
          matchedCall.callOutcome = 'Connected';
          if (!matchedCall.duration || matchedCall.duration === 0) {
            matchedCall.duration = rec.approxDuration;
            matchedCall.call_duration = rec.approxDuration;
          }
          if (rec.contactName && (!matchedCall.caller_name || matchedCall.caller_name === 'Direct Phone Call')) {
            matchedCall.caller_name = rec.contactName;
            matchedCall.leadName = rec.contactName;
          }
          if (rec.phone && (!matchedCall.phone || String(matchedCall.phone).replace(/\D/g, '').length < 7)) {
            matchedCall.phone = rec.phone;
            matchedCall.caller_number = rec.phone;
          }
          // Preserve authentic device; do not mutate existing recognized device
          const curCallDevKey = normDevKey(matchedCall.deviceName || matchedCall.device_name || matchedCall.staff_name);
          if (!curCallDevKey) {
            matchedCall.deviceName = canonicalDevName(rec.deviceName);
            matchedCall.device_name = matchedCall.deviceName;
            matchedCall.staff_name = matchedCall.deviceName;
          }
          attachedCount++;
        }
      } else if (rec.timestamp) {
        const recTime = new Date(rec.timestamp).getTime();
        if (recTime >= CUTOFF_DATE) {
          const isOnePlus = rec.deviceName === 'OnePlus';
          const rawRecName = (rec.contactName && !/^\+?[\d\s()-]{6,}$/.test(String(rec.contactName).trim())) ? rec.contactName : '';
          const cName = rawRecName || (rec.phoneDigits ? 'Direct Phone Call' : (isOnePlus ? 'OnePlus Call (' + (rec.formattedTime || 'Recent') + ')' : 'Direct Customer Call'));
          let resolvedPhone = rec.phone || resolveContactNameToPhone(rawRecName) || '';
          let cNum = (resolvedPhone && /\d{7,}/.test(resolvedPhone)) ? resolvedPhone : ((rec.phoneDigits && rec.phoneDigits.length === 10) ? ('+91' + rec.phoneDigits) : '');
          const isOutbound = /out|outgoing|dialed/i.test(rec.name || '') || /outbound/i.test(rec.direction || '') || !!(KNOWN_DRIVE_MAPPINGS[rec.id] && KNOWN_DRIVE_MAPPINGS[rec.id].dir === 'OUTBOUND');
          const callDir = (KNOWN_DRIVE_MAPPINGS[rec.id] && KNOWN_DRIVE_MAPPINGS[rec.id].dir) || (isOutbound ? 'OUTBOUND' : (rec.direction || 'INBOUND'));
          const devName = canonicalDevName(rec.deviceName || 'OnePlus');
          const newCall = {
            id: `call-rec-${rec.id}`,
            caller_number: cNum,
            phone: cNum,
            caller_name: cName,
            leadName: cName,
            recording_file_name: rec.name,
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
      // Never put caller names or non-phone text inside phone/caller_number; never put phone digits inside caller_name/leadName
      const curNum = String(c.phone || c.caller_number || '').trim();
      const parenMatch = curNum.match(/\(([^)]+)\)/);
      if (parenMatch && parenMatch[1] && (!c.caller_name || c.caller_name === 'Direct Phone Call')) {
        const inner = parenMatch[1].trim();
        if (inner && !/^\+?[\d\s()-]{6,}$/.test(inner)) {
          c.caller_name = inner;
          c.leadName = inner;
        }
      }
      const digitsOnly = curNum.split('(')[0].replace(/\D/g, '');
      if (/^1800\d{6,7}$/.test(digitsOnly) || digitsOnly === '112') {
        c.caller_number = digitsOnly;
        c.phone = digitsOnly;
      } else if (digitsOnly.length >= 10) {
        const formatted = '+91' + digitsOnly.slice(-10);
        c.caller_number = formatted;
        c.phone = formatted;
      } else {
        const rawNm = c.caller_name || c.leadName || '';
        const cleanNm = String(rawNm).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
        const resolvedP = resolveContactNameToPhone(rawNm) || dynamicPhoneByName.get(cleanNm) || '';
        c.caller_number = resolvedP || '';
        c.phone = resolvedP || '';
      }
      if (/^\+?[\d\s()-]{6,}$/.test(String(c.caller_name || '').trim())) {
        c.caller_name = 'Direct Phone Call';
        c.leadName = 'Direct Phone Call';
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
