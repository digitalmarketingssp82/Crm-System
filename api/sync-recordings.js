let _cachedSyncData = null;
let _cachedSyncTime = 0;


const KNOWN_OUTBOUND_CONTACTS = [
  'poonam', 'harvinder',
  'anwarul', 'shr', 'sushil kumar', 'parminder singh', 'suresh chand',
  'rajni rani', 'mohan bni', 'parag ravish', 'dinesh highland', 'nikhil mishra',
  'jagjeevan', 'satpal singh', 'ranjeet kaur', 'vikram jeet', 'sukhwinder'
];

const KNOWN_CONTACT_PHONES = {
  'poonam': '+919888810811',
  'harvinder': '+919888810811',
  'amardeep nijjar': '+919803030388',
  'harpreet singh': '+919877142366',
  'kulwant singh': '+919814421127',
  'rajni bhat': '+919876521035',
  'priyanka vasisht': '+917814941639',
  'eshan gaur': '+919814120340',
  'nil kamal devi': '+919872019485',
  'dispatch np': '+919815045700',
  'hitinkumar kantilal udharej': '+919825012345',
  'spam alert from jio': '+911409000000',
  'monu kitchen': '+916280251494',
  'monu kitchen np': '+916280251494',
  'parminder singh': '+918558055750',
  'sushil kumar': '+919815045731',
  'shr': '+917015274682',
  'dinesh highland': '+917988695768',
  'dinesh highland hn no 9': '+917988695768',
  'jagjeevan gmb': '+919815045732',
  'jagjeevan gmb mohali': '+919815045732',
  'nikhil mishra': '+919151610556',
  'tushar sharma': '+919501653648',
  'anwarul sir': '+917357441912',
  'anwarul sir plywood': '+917357441912',
  'suresh chand': '+919876754841',
  'rajni rani singla': '+919877865282',
  'vikram jeet singh': '+918437816715',
  'flipkart': '18002029898',
  'flipkart customer service': '18002029898',
  'sukhwinder singh': '+917814304573',
  'asam ali': '+916284538873',
  'satpal singh': '+917015920657',
  'mohan bni': '+919803353372',
  'mohan bni id 17': '+919803353372',
  'megha kumari': '+917503238194',
  'ranjeet kaur': '+919915911009',
  'rakesh kumar singh': '+918146795795',
  'rakesh kalra': '+918146795795',
  'meenu saxena': '+918146367711',
  'parag ravish': '+919877808859',
  'parmjit singh': '+919876111118',
  'shiv charan': '+919814015003',
  'rupinder singh': '+917508648100',
  'manga khan': '+919878685521',
  'rajender': '+918745036534',
  'kamlesh jaswal': '+919779947870',
  'jaimal singh': '+919814017001'
};

function resolveContactNameToPhone(contactName) {
  if (!contactName) return '';
  const clean = String(contactName).toLowerCase().replace(/[\(\)\-]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [k, p] of Object.entries(KNOWN_CONTACT_PHONES)) {
    if (clean.includes(k) || k.includes(clean)) return p;
  }
  return '';
}

const KNOWN_DRIVE_MAPPINGS = {
  "1on8TzhkXrnG2F-K8fA6SY9srlnNZSCpE": { "name": "+917942748821", "phone": "+917942748821", "dur": 26, "time": "05 Nov, 01:38 PM", "device": "OnePlus", "dir": "INBOUND", "file": "+917942748821-2611051337.mp3" },
  "1HcI8qnsAsO4PmSvl9YVbD3pgQUSgU69e": { "name": "+918427761777", "phone": "+918427761777", "dur": 225, "time": "05 Nov, 01:35 PM", "device": "OnePlus", "dir": "INBOUND", "file": "+918427761777-2611051332.mp3" },
  "1v6HE2E6CufBnzsJ9oBdmgjxJ_dCNHrvN": { "name": "9466609171", "phone": "+919466609171", "dur": 42, "time": "05 Nov, 01:21 PM", "device": "iQOO", "dir": "OUTBOUND", "file": "9466609171-2611051320.mp3" },
  "1sAcuoUO6hJhFQIi0r8SGLOYnxwA-YLMa": { "name": "AKSHAY BHATNAGAR", "phone": "+918287589854", "dur": 51, "time": "05 Nov, 01:30 PM", "device": "OnePlus", "dir": "INBOUND", "file": "AKSHAY BHATNAGAR-2611051329.mp3" },
  "12oZbi1MQ5TTcwimtmJU69f_bHvmjUB51": { "name": "Akash Gupta Ambala", "phone": "+919034236263", "dur": 34, "time": "05 Nov, 12:54 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Akash Gupta Ambala-2611051253.mp3" },
  "1fDK3IyrKMBBa8CgqBfzT7MzKROp3mivN": { "name": "Fakir Chand", "phone": "+919465061786", "dur": 73, "time": "05 Nov, 12:56 PM", "device": "OnePlus", "dir": "INBOUND", "file": "Fakir Chand-2611051232.mp3" },
  "1LHCu17VhfALSe97YgZTv7MfUAn2hjmMS": { "name": "KIRANJOT SINGH", "phone": "+919872412345", "dur": 39, "time": "05 Nov, 02:56 PM", "device": "OnePlus", "dir": "INBOUND", "file": "KIRANJOT SINGH-2611051456.mp3" },
  "1AzDIMD3Y961_qeeWC53TglNKM_ILQphF": { "name": "( Spam Alert From Jio) Mazed Mallick", "phone": "+918293805138", "dur": 45, "time": "05 Nov, 12:13 PM", "device": "OnePlus", "dir": "INBOUND", "file": "( Spam Alert From Jio) Mazed Mallick-2611051213.mp3" },
  "1mDYWSyB2RMebaSiYYc6Uky4ne6TCWh4Q": {
    "name": "Poonam (Harvinder)",
    "phone": "+919888810811",
    "dur": 25,
    "time": "04 Nov, 02:44 PM",
    "device": "iQOO",
    "dir": "OUTBOUND",
    "file": "POONAM-2611041445.mp3"
  },
  "1tPx5V2Fy0LoiehKmOzIpLbixxO9BtJiT": {
    "name": "Poonam (Harvinder)",
    "phone": "+919888810811",
    "dur": 30,
    "time": "04 Nov, 02:46 PM",
    "device": "iQOO",
    "dir": "OUTBOUND",
    "file": "POONAM-2611041446.mp3"
  },
  "1jHNtG1sSzcYxrgEZMwu-rXRCFr0LwOB_": {
    "name": "PARMINDER SINGH",
    "phone": "+918558055750",
    "dur": 22,
    "time": "2 Nov, 05:12 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "PARMINDER SINGH-2611021712.mp3"
  },
  "1yXaNUei3OjuxgELlqKxydp85J0veX5nO": {
    "name": "Sushil Kumar",
    "phone": "+919815045731",
    "dur": 57,
    "time": "2 Nov, 04:50 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Sushil Kumar-2611021650.mp3"
  },
  "1Mq7sdU7WhnfjEPS13ieba0bNYdIw__in": {
    "name": "Shr",
    "phone": "+917015274682",
    "dur": 25,
    "time": "2 Nov, 04:46 PM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "Shr-2611021646.mp3"
  },
  "14Mtf-tYCHFfCcSN9SSTTVKh60npPD-Gu": {
    "name": "Shr",
    "phone": "+917015274682",
    "dur": 24,
    "time": "2 Nov, 04:43 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Shr-2611021643.mp3"
  },
  "11r-fl-KaW2-7Kw6bYazhlv4aAeYePPO7": {
    "name": "Direct Customer Call",
    "phone": "+919872599749",
    "dur": 48,
    "time": "2 Nov, 04:36 PM",
    "device": "Samsung Galaxy",
    "dir": "INBOUND",
    "file": "Call recording +919872599749_261102_163648.m4a"
  },
  "1-HwgXZZfyUZLxa8-l8zAOjPhq5K_I54N": {
    "name": "Shr",
    "phone": "+917015274682",
    "dur": 52,
    "time": "2 Nov, 04:31 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Shr-2611021631.mp3"
  },
  "1EYd3qBduSU_NP9JXxeo8MlETmQHv94I6": {
    "name": "Dinesh Highland Hn No 9",
    "phone": "+917988695768",
    "dur": 67,
    "time": "2 Nov, 04:23 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Dinesh Highland Hn No 9-2611021623.mp3"
  },
  "1caf1BOZ9TO9Kc4WzpTyoZGFH_HzozeLP": {
    "name": "Monu Kitchen Np",
    "phone": "+916280251494",
    "dur": 72,
    "time": "2 Nov, 02:30 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Monu Kitchen Np-2611021430.mp3"
  },
  "1WWzFE2Uhgl_FeFKpNbWIEjVnBBlg1Ag4": {
    "name": "Shr",
    "phone": "+917015274682",
    "dur": 122,
    "time": "2 Nov, 02:27 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Shr-2611021427.mp3"
  },
  "1L3svOsmB3Z2NDKry47XlrtqLr9kJPH92": {
    "name": "Jagjeevan Gmb Mohali",
    "phone": "+919815045732",
    "dur": 55,
    "time": "2 Nov, 02:19 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Jagjeevan Gmb Mohali-2611021419.mp3"
  },
  "1dmwFIgXn7T5bSKZMLPVEfjQDmVZs-64o": {
    "name": "Nikhil Mishra",
    "phone": "+919151610556",
    "dur": 126,
    "time": "2 Nov, 02:08 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Nikhil Mishra-2611021408.mp3"
  },
  "1SjGPApSYRsTezVfA6PfM26R9Is0xZYIA": {
    "name": "Tushar Sharma",
    "phone": "+919501653648",
    "dur": 10,
    "time": "2 Nov, 01:22 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "( Spam Alert From Jio) Tushar Sharma-2611021322.mp3"
  },
  "1so-pNF1ro0lgyNAAcBvuLeYXBx6cryD4": {
    "name": "Monu Kitchen Np",
    "phone": "+916280251494",
    "dur": 18,
    "time": "2 Nov, 01:11 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Monu Kitchen Np-2611021311.mp3"
  },
  "1lKilBeKNdiLNRf3SKcGHiS__0ryKgAO5": {
    "name": "Anwarul Sir Plywood",
    "phone": "+919463446101",
    "dur": 37,
    "time": "2 Nov, 01:06 PM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "Anwarul Sir Plywood-2611021306.mp3"
  },
  "1vi29vVzTwFe4rgu9V3tIEVjfO8zmznRr": {
    "name": "Anwarul Sir Plywood",
    "phone": "+917357441912",
    "dur": 18,
    "time": "2 Nov, 01:04 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Anwarul Sir Plywood-2611021304.mp3"
  },
  "1Ke-P02cvo9ClDNOa1tfnUaaM1eWGZEtH": {
    "name": "SURESH CHAND",
    "phone": "+919876754841",
    "dur": 137,
    "time": "2 Nov, 12:19 PM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "SURESH CHAND-2611021219.mp3"
  },
  "1RHY2u2oT5xQdtrWxYxGe2dhXXVRcEI15": {
    "name": "SURESH CHAND",
    "phone": "+919876754841",
    "dur": 216,
    "time": "2 Nov, 12:15 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "SURESH CHAND-2611021215.mp3"
  },
  "1jXfXU7EtKMURImgh0mJhntTOX4nJ5Y2G": {
    "name": "Direct Phone Call",
    "phone": "+917508325292",
    "dur": 61,
    "time": "2 Nov, 11:42 AM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "+917508325292-2611021142.mp3"
  },
  "1fDFKseUVHa_JQC1k9Qp-hCI6SUHzNZoL": {
    "name": "Direct Phone Call",
    "phone": "+919464481892",
    "dur": 71,
    "time": "2 Nov, 11:40 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+919464481892-2611021140.mp3"
  },
  "1avg6ghn4uMWpv0GTK_EuzJKSfx5PeL5x": {
    "name": "Direct Phone Call",
    "phone": "+917528951999",
    "dur": 69,
    "time": "2 Nov, 11:07 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+917528951999-2611021107.mp3"
  },
  "1yK2Wn01IQpiZfSD6cgqUiIvJW0gJNv8j": {
    "name": "Direct Phone Call",
    "phone": "+919876345045",
    "dur": 10,
    "time": "2 Nov, 11:05 AM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "+919876345045-2611021105.mp3"
  },
  "1DUw3_AnbOIeDk7vyQEgy6NbdbtWzPl1r": {
    "name": "Direct Phone Call",
    "phone": "+919370490007",
    "dur": 32,
    "time": "2 Nov, 11:04 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+919370490007-2611021104.mp3"
  },
  "1pj42TO_SDNbG20TqG-z7zgqYS81BKPEz": {
    "name": "Direct Phone Call",
    "phone": "+917009271810",
    "dur": 44,
    "time": "2 Nov, 11:03 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+917009271810-2611021103.mp3"
  },
  "1hV_GviKrWF7YCO-MlZn5vz81bW_5h9eY": {
    "name": "Direct Phone Call",
    "phone": "+918279423299",
    "dur": 42,
    "time": "2 Nov, 11:01 AM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "+918279423299-2611021101.mp3"
  },
  "1XWVBKxBcZoS9N6tuFuxdBaDo4Smn6x-c": {
    "name": "Direct Phone Call",
    "phone": "+918427555333",
    "dur": 10,
    "time": "2 Nov, 11:00 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+918427555333-2611021100.mp3"
  },
  "1kwEv6qhzhQsVbqqM27ZHXRt_BdgAAQLl": {
    "name": "Direct Phone Call",
    "phone": "+918968337146",
    "dur": 55,
    "time": "2 Nov, 10:58 AM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "+918968337146-2611021058.mp3"
  },
  "1r64PUn1UkQi0bkBqCxOY_i4YSYrfjiq8": {
    "name": "Direct Phone Call",
    "phone": "+919878285052",
    "dur": 60,
    "time": "2 Nov, 10:56 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+919878285052-2611021056.mp3"
  },
  "1BDCeF8mfoC20ddCrQXChYXoTd7-G989r": {
    "name": "Direct Phone Call",
    "phone": "+917508325292",
    "dur": 160,
    "time": "2 Nov, 10:53 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+917508325292-2611021053.mp3"
  },
  "1_OhfPHF-tT2HfBlmnHZ9PX4LkGt0PwBk": {
    "name": "Rajni Rani Singla",
    "phone": "+919877865282",
    "dur": 26,
    "time": "2 Nov, 10:51 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Rajni Rani Singla-2611021051.mp3"
  },
  "1_O8N13m35Q59GYh5zXSLDV2Aj2ISLNuz": {
    "name": "Direct Phone Call",
    "phone": "+919779458368",
    "dur": 97,
    "time": "2 Nov, 10:48 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+919779458368-2611021048.mp3"
  },
  "1q3NLQMxc1sFV5XnI9-y8I_AHE_ClEuVX": {
    "name": "Direct Phone Call",
    "phone": "+917837380268",
    "dur": 23,
    "time": "2 Nov, 10:46 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+917837380268-2611021046.mp3"
  },
  "1RQX70d1qrtP0-UlkxHoKEbdqGRe4aPLk": {
    "name": "Vikram Jeet Singh",
    "phone": "+918437816715",
    "dur": 190,
    "time": "31 Oct, 06:12 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Vikram Jeet Singh-2610311812.mp3"
  },
  "1ZSXc5UMniO9gvkDKTn-EYCptKTl62bFT": {
    "name": "Direct Customer Call",
    "phone": "+918035067063",
    "dur": 18,
    "time": "31 Oct, 05:30 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+918035067063-2610311730.mp3"
  },
  "1_Qly-WJWuUAq10YL9GfOW2l0jg6yOX_v": {
    "name": "Flipkart Customer Service",
    "phone": "18002029898",
    "dur": 21,
    "time": "31 Oct, 05:28 PM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "Flipkart Customer Service-2610311728.mp3"
  },
  "1dBNbJw7SqLNrRHCaRw3qYqrYyaK-PlQ0": {
    "name": "Sukhwinder Singh",
    "phone": "+917814304573",
    "dur": 51,
    "time": "31 Oct, 04:59 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Sukhwinder Singh-2610311657.mp3"
  },
  "1ooym57tN6TCRbOoPuwCgstMGJUdVFDX6": {
    "name": "Asam Ali",
    "phone": "+916284538873",
    "dur": 38,
    "time": "31 Oct, 04:49 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Asam Ali-2610311649.mp3"
  },
  "1cM9bHOFAqAENomgS67u91zFPBUVPTP7z": {
    "name": "Shr",
    "phone": "+917015274682",
    "dur": 20,
    "time": "31 Oct, 04:31 PM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "Shr-2610311631.mp3"
  },
  "1otPBnoHO3S4HiRCFDRT1mIZ_ifq0NkqK": {
    "name": "Satpal Singh",
    "phone": "+917015920657",
    "dur": 18,
    "time": "31 Oct, 03:59 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Satpal Singh-2610311559.mp3"
  },
  "1sYj7II19LV4YaeLAW1pOcOKprMmCaFjS": {
    "name": "Shr",
    "phone": "+917015274682",
    "dur": 123,
    "time": "31 Oct, 03:54 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Shr-2610311552.mp3"
  },
  "1C3K-Qg04jdsKH5NhuHK5jOLPrRDC3Mnd": {
    "name": "Direct Phone Call",
    "phone": "+919888123522",
    "dur": 45,
    "time": "31 Oct, 02:44 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "9888123522-2610311444.mp3"
  },
  "14f540CWr7cW3WDRQYHK8V59YiP5gmrBV": {
    "name": "Mohan BNI ID 17",
    "phone": "+919803353372",
    "dur": 68,
    "time": "31 Oct, 02:22 PM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "Mohan BNI ID 17-2610311422.mp3"
  },
  "1tYP3PngjyLFNpSssUYe9Fxm3vmMtsMdo": {
    "name": "Megha Kumari",
    "phone": "+917503238194",
    "dur": 173,
    "time": "31 Oct, 01:46 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Megha Kumari-2610311346.mp3"
  },
  "1J7_7BU5-ewVgJrQGHzO9mXtwC244r8A1": {
    "name": "Mohan BNI ID 17",
    "phone": "+919803353372",
    "dur": 108,
    "time": "31 Oct, 12:43 PM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "Mohan BNI ID 17-2610311241.mp3"
  },
  "1hUDwEjnlUR9ec1fx-HYfWsCfxNmFKQiA": {
    "name": "Mohan BNI ID 17",
    "phone": "+919803353372",
    "dur": 45,
    "time": "31 Oct, 12:39 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Mohan BNI ID 17-2610311239.mp3"
  },
  "1hQpbXDVl-PxfgOGaGbCw0hyozaMkro5l": {
    "name": "Direct Phone Call",
    "phone": "+919213555070",
    "dur": 30,
    "time": "31 Oct, 12:17 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "( Spam Alert From Jio) Hitinkumar Kantilal Udharej-2610311217.mp3"
  },
  "1bCRhrQ8GGoYemuzLSBShGxdN4GDufPfc": {
    "name": "Direct Phone Call",
    "phone": "+917888398327",
    "dur": 13,
    "time": "31 Oct, 12:05 PM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Ranjeet Kaur-2610311205.mp3"
  },
  "1PwfwmTss9VN8KAY57cNcvc9utZ0VqNI_": {
    "name": "+919211445291",
    "phone": "+919211445291",
    "dur": 28,
    "time": "31 Oct, 11:29 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "+919211445291-2610311129.mp3"
  },
  "12FHbK8cYo3Vq68TXmiz_-T-ZQE7fDGFE": {
    "name": "Parag Ravish",
    "phone": "+919877808859",
    "dur": 29,
    "time": "31 Oct, 11:20 AM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "Parag Ravish-2610311120.mp3"
  },
  "1uQ4AQG9O_TRpNP3_21FcxwF68Mdo1ay7": {
    "name": "PARMJIT SINGH",
    "phone": "+919876111118",
    "dur": 77,
    "time": "31 Oct, 11:18 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "PARMJIT SINGH-2610311118.mp3"
  },
  "18b2Go-z_qanzXkPWAHpeKNbbMKQCHZLT": {
    "name": "Mohan BNI ID 17",
    "phone": "+919803353372",
    "dur": 52,
    "time": "31 Oct, 11:08 AM",
    "device": "OnePlus",
    "dir": "OUTBOUND",
    "file": "Mohan BNI ID 17-2610311107.mp3"
  },
  "1pHrefV3hsT18KiCr7yQEUFNMciTzlM4u": {
    "name": "PARMINDER SINGH",
    "phone": "+918558055750",
    "dur": 10,
    "time": "31 Oct, 11:01 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "PARMINDER SINGH-2610311101.mp3"
  },
  "1PRKLkiAhqwHzPnSOXeVPvd7diZvZD-bx": {
    "name": "Mohan BNI ID 17",
    "phone": "+919803353372",
    "dur": 37,
    "time": "31 Oct, 11:00 AM",
    "device": "OnePlus",
    "dir": "INBOUND",
    "file": "Mohan BNI ID 17-2610311100.mp3"
  },
  "1GRtR0L6KNxrMdnXKFSdLg45wBHUzkGb0": {
    "name": "Shiv Charan",
    "phone": "+919814015003",
    "dur": 74,
    "time": "30 Oct, 03:00 PM",
    "device": "Samsung Galaxy",
    "dir": "INBOUND",
    "file": "Call recording Shiv Charan_261030_150035.m4a"
  },
  "1L5vY7owRBqycDyDAG4EX0ZY6MfNdc6Ep": {
    "name": "Rupinder Singh",
    "phone": "+917508648100",
    "dur": 44,
    "time": "29 Oct, 02:28 PM",
    "device": "Samsung Galaxy",
    "dir": "INBOUND",
    "file": "Call recording +917508648100_261029_142818.m4a"
  },
  "1vS9HBD2OEZi5mhyBoJTkDedgoVonNQGr": {
    "name": "Manga Khan",
    "phone": "+919878685521",
    "dur": 55,
    "time": "26 Oct, 01:01 PM",
    "device": "Samsung Galaxy",
    "dir": "OUTBOUND",
    "file": "Call recording Manga Khan_261026_130115.m4a"
  },
  "1OCBSUwITJbqJEHj0Won27gt7ocIAuOLR": {
    "name": "Rajender",
    "phone": "+918745036534",
    "dur": 32,
    "time": "26 Oct, 12:22 PM",
    "device": "Samsung Galaxy",
    "dir": "INBOUND",
    "file": "Call recording Rajender_261026_122204.m4a"
  },
  "1i_uyCGQ9iEJJIXNA9tEnO5ruWGPmFI7p": {
    "name": "Manga Khan",
    "phone": "+919878685521",
    "dur": 81,
    "time": "26 Oct, 12:07 PM",
    "device": "Samsung Galaxy",
    "dir": "INBOUND",
    "file": "Call recording Manga Khan_261026_120747.m4a"
  },
  "1BWn0twXbTBk5ORoaadD8JaX7EHdw4ude": {
    "name": "KAMLESH JASWAL",
    "phone": "+919779947870",
    "dur": 100,
    "time": "24 Oct, 12:28 PM",
    "device": "Samsung Galaxy",
    "dir": "INBOUND",
    "file": "Call recording KAMLESH JASWAL_261024_122836.m4a"
  },
  "1WAtnBpjljm3tf4OgySDzOLNVZQ6h7gzF": {
    "name": "Direct Customer Call",
    "phone": "+919530895341",
    "dur": 23,
    "time": "24 Oct, 11:57 AM",
    "device": "Samsung Galaxy",
    "dir": "INBOUND",
    "file": "Call recording +919530895341_261024_115726.m4a"
  },
  "13t35tqFyFD_xzxUL-OwY6vDK0W5z7myL": {
    "name": "Jaimal Singh",
    "phone": "+919814017001",
    "dur": 15,
    "time": "22 Oct, 05:00 PM",
    "device": "Samsung Galaxy",
    "dir": "OUTBOUND",
    "file": "Call recording Jaimal Singh_261022_170012.m4a"
  }
};

function isSamePhysicalCall(a, b) {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  if (a.drive_file_id && b.drive_file_id && a.drive_file_id === b.drive_file_id) return true;

  // CRITICAL GUARD 1: If both have drive_file_ids and they are different, they are different recordings!
  if (a.drive_file_id && b.drive_file_id && a.drive_file_id !== b.drive_file_id) return false;

  // CRITICAL GUARD 2: If both have distinct audio URLs, they can NEVER be merged!
  const recA = a.recording_url || a.audioUrl || '';
  const recB = b.recording_url || b.audioUrl || '';
  if (recA && recB && recA !== recB && !recA.includes('Pending') && !recB.includes('Pending') && recA.length > 10 && recB.length > 10) return false;

  const pA = String(a.caller_number || a.phone || '').replace(/\D/g, '').slice(-10);
  const pB = String(b.caller_number || b.phone || '').replace(/\D/g, '').slice(-10);

  // STRICT RULE: If BOTH records have valid phone numbers and they are DIFFERENT, they can NEVER be the same physical call!
  if (pA && pB && pA.length >= 7 && pB.length >= 7 && pA !== pB) {
    return false;
  }

  // Extract device names
  const devA = String(a.deviceName || a.device_name || a.staff_name || '').toLowerCase();
  const devB = String(b.deviceName || b.device_name || b.staff_name || '').toLowerCase();
  const isDevAOnePlus = devA.includes('oneplus') || devA.includes('one plus');
  const isDevBOnePlus = devB.includes('oneplus') || devB.includes('one plus');

  const durA = Number(a.duration || a.call_duration || 0);
  const durB = Number(b.duration || b.call_duration || 0);

  const outA = String(a.call_outcome || a.outcome || a.callOutcome || '').toLowerCase();
  const outB = String(b.call_outcome || b.outcome || b.callOutcome || '').toLowerCase();
  const isMissedA = outA.includes('missed') || ((durA === 0) && !recA);
  const isMissedB = outB.includes('missed') || ((durB === 0) && !recB);

  const tA = new Date(a.created_at || a.timestamp || a.time || 0).getTime();
  const tB = new Date(b.created_at || b.timestamp || b.time || 0).getTime();

  // Deduplicate and suppress phantom Samsung calls when OnePlus answered call
  if (pA && pB && pA.length >= 7 && pA === pB) {
    if ((isDevAOnePlus !== isDevBOnePlus) && (isMissedA !== isMissedB)) {
      if (tA > 0 && tB > 0 && Math.abs(tA - tB) <= 180000) {
        return true;
      }
    }
  }

  // Deduplicate burst missed calls within 15 seconds
  if (isMissedA && isMissedB) {
    if (pA && pB && pA === pB && tA > 0 && tB > 0 && Math.abs(tA - tB) <= 15000) {
      return true;
    }
  }

  // If calls are from different physical devices:
  if (isDevAOnePlus !== isDevBOnePlus) {
    return false;
  }

  // CRITICAL GUARD 3: If both calls were connected with duration > 0, they are separate calls unless within 15 seconds (network retry packet)
  if (durA > 0 && durB > 0 && !isMissedA && !isMissedB) {
    if (tA > 0 && tB > 0 && Math.abs(tA - tB) <= 15000 && durA === durB) {
      return true; // Exact duplicate webhook packet
    }
    return false; // Distinct conversations! Do NOT merge!
  }

  // On the SAME device:
  // 1. Same phone number where one is Missed and one is Connected within 3 minutes (absorb phantom dial trigger)
  if (pA && pB && pA.length >= 7 && pA === pB) {
    if (isMissedA !== isMissedB && tA > 0 && tB > 0 && Math.abs(tA - tB) <= 180000) {
      return true;
    }
  }

  // 2. On the SAME device, merge audio recording with pending MacroDroid call record
  const aHasAudio = !!(recA || a.drive_file_id);
  const bHasAudio = !!(recB || b.drive_file_id);
  if (aHasAudio !== bHasAudio && tA > 0 && tB > 0 && Math.abs(tA - tB) <= 900000) {
    if (pA && pB && pA === pB) return true;
    const nameA = String(a.caller_name || a.leadName || '').toLowerCase().trim();
    const nameB = String(b.caller_name || b.leadName || '').toLowerCase().trim();
    if (nameA && nameB && nameA === nameB && nameA !== 'direct phone call') return true;
    if ((!pA || !pB) && isDevAOnePlus && isDevBOnePlus && Math.abs(tA - tB) <= 300000) return true;
  }

  return false;
}

function deduplicateCalls(callsList) {
  if (!Array.isArray(callsList)) return [];
  const deduped = [];
  const seenIds = new Set();
  const sorted = callsList.slice().sort((a, b) => {
    const aHas = !!(a.recording_url || a.audioUrl || a.drive_file_id);
    const bHas = !!(b.recording_url || b.audioUrl || b.drive_file_id);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return new Date(b.created_at || b.timestamp || 0).getTime() - new Date(a.created_at || a.timestamp || 0).getTime();
  });
  for (const c of sorted) {
    if (!c || seenIds.has(c.id)) continue;
    
    // STRICT: Zero Samsung calls on 02 Nov and 31 Oct!
    const isSamsung = String(c.staff_name || c.device_name || c.deviceName || '').toLowerCase().includes('samsung');
    const is31Oct = (c.time && c.time.includes('31 Oct')) || (c.created_at && c.created_at.includes('2026-10-31'));
    const is02Nov = (c.time && (c.time.includes('02 Nov') || c.time.includes('2 Nov'))) || (c.created_at && c.created_at.includes('2026-11-02'));
    if (isSamsung && (is31Oct || is02Nov)) continue;

    const exIdx = deduped.findIndex(ex => isSamePhysicalCall(ex, c));
    if (exIdx !== -1) {
      if ((c.recording_url || c.audioUrl) && !deduped[exIdx].recording_url) {
        deduped[exIdx].recording_url = c.recording_url || c.audioUrl;
        deduped[exIdx].audioUrl = c.recording_url || c.audioUrl;
        deduped[exIdx].drive_file_id = c.drive_file_id || deduped[exIdx].drive_file_id;
        deduped[exIdx].hasAudio = true;
      }
      const exDir = String(deduped[exIdx].direction || deduped[exIdx].call_type || '').toUpperCase();
      const curDir = String(c.direction || c.call_type || '').toUpperCase();
      if (curDir.includes('OUT') || exDir.includes('OUT')) {
        deduped[exIdx].direction = 'OUTBOUND';
        deduped[exIdx].call_type = 'OUTBOUND';
      }
      // Merge real customer number & name from c if deduped[exIdx] lacks it
      const cNum = String(c.caller_number || c.phone || '').replace(/\D/g, '').slice(-10);
      const exNum = String(deduped[exIdx].caller_number || deduped[exIdx].phone || '').replace(/\D/g, '').slice(-10);
      if (cNum && cNum.length === 10 && (!exNum || exNum.length < 10)) {
        deduped[exIdx].caller_number = c.caller_number || c.phone;
        deduped[exIdx].phone = c.phone || c.caller_number;
        if (c.caller_name && !c.caller_name.includes('Direct Call') && !c.caller_name.includes('Interview-')) {
          deduped[exIdx].caller_name = c.caller_name;
          deduped[exIdx].leadName = c.leadName || c.caller_name;
        }
      }
      if (c.lead_id && !deduped[exIdx].lead_id) deduped[exIdx].lead_id = c.lead_id;
      if (c.leadId && !deduped[exIdx].leadId) deduped[exIdx].leadId = c.leadId;
      if (c.deviceName && !deduped[exIdx].deviceName) deduped[exIdx].deviceName = c.deviceName;
      if (c.device_name && !deduped[exIdx].device_name) deduped[exIdx].device_name = c.device_name;
      seenIds.add(c.id);
    } else {
      seenIds.add(c.id);
      deduped.push(c);
    }
  }
  return deduped;
}

const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DEFAULT_FOLDER_ID = '1OHR3g8GWBaVNAa7kB6aRdk-WYmCngWh_';

let CALL_LOGS_FILE = path.join(__dirname, '..', 'call_logs.json');
try {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || !fs.existsSync(path.join(__dirname, '..'))) {
    CALL_LOGS_FILE = path.join('/tmp', 'call_logs.json');
  }
} catch(e) {}

function fetchDriveFolderHTML(folderId) {
  return new Promise((resolve, reject) => {
    // sort=14&direction=d sorts by Last Modified date descending to always get the newest call recordings first
    const fetchUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}&sort=14&direction=d&_t=${Date.now()}`;
    https.get(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
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
    if (name.endsWith('.m4a') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.aac')) {
      rawItems.push({ id, name, size: 500000 });
    }
  }

  // Method 2: Fallback to _DRIVE_ivd if flip-entry was empty
  if (rawItems.length === 0) {
    const ivdMatch = html.match(/_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
    if (ivdMatch) {
      try {
        const unescaped = ivdMatch[1].replace(/\\x([0-9A-Fa-f]{2})/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
        const parsed = JSON.parse(unescaped);
        if (Array.isArray(parsed[0])) {
          parsed[0].forEach(it => {
            const id = it[0];
            const name = it[2] || '';
            const size = it[13] || 0;
            if (name.endsWith('.m4a') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.aac')) {
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
      // Parallel fetch across all folders for fast sub-2s execution
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

    // Read stored calls
    let calls = [];
    try {
      if (fs.existsSync(CALL_LOGS_FILE)) {
        calls = JSON.parse(fs.readFileSync(CALL_LOGS_FILE, 'utf8'));
      }
    } catch(e) {
      calls = [];
    }

    // Fallback: seed from bundled call_logs.json if empty
    if (!calls || calls.length === 0) {
      const bundledPath = path.join(__dirname, '..', 'call_logs.json');
      if (fs.existsSync(bundledPath)) {
        try {
          calls = JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
        } catch(e) {}
      }
    }

    // Note: Legitimate iQOO recordings are preserved!

        // Deduplicate drive recordings across multiple folders by file name
    // and determine authentic native device
    // Priority: If file is in iQOO dedicated folder (1w2jK16SCGJrNrk7D_UYTMljKD56oPG76), keep device as iQOO!
    const seenFileNames = new Map();
    driveRecs.forEach(r => {
      const cleanName = (r.name || '').trim();
      if (!cleanName) return;

      const isSamsungFormat = cleanName.match(/^Call recording\s+/i);

      if (r.originFolderDevice === 'iQOO' || r.deviceName === 'iQOO') {
        r.deviceName = 'iQOO';
      } else if (isSamsungFormat) {
        r.deviceName = 'Samsung Galaxy';
      } else {
        r.deviceName = r.deviceName || 'OnePlus';
      }

      // If already seen, dedicated folder takes precedence over auto/legacy folder
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
    const CUTOFF_DATE = new Date('2026-10-20T00:00:00.000Z').getTime();

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
            return Math.abs(recTime - callTime) <= 1800000;
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
              return Math.abs(recTime - cTime) <= 1800000;
            }
            return false;
          });
        }
      }

      if (!matchedCall && rec.timestamp) {
        const recTime = new Date(rec.timestamp).getTime();
        matchedCall = calls.find(c => {
          if (c.recording_url && !c.recording_url.includes('UklGRuRdAABX')) return false;
          const cDev = (c.device_name || c.deviceName || c.staff_name || '').toLowerCase();
          const rDev = (rec.deviceName || '').toLowerCase();
          const devMatch = (cDev.includes('oneplus') && rDev.includes('oneplus')) || 
                           (cDev.includes('samsung') && rDev.includes('samsung')) ||
                           (cDev.includes('iq') && rDev.includes('iq')) ||
                           (!cDev || cDev === 'all');
          if (!devMatch) return false;
          const cTime = new Date(c.created_at || c.timestamp || c.time).getTime();
          return !isNaN(cTime) && Math.abs(recTime - cTime) <= 900000;
        });
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
          const resolvedPhone = rec.phone || resolveContactNameToPhone(rec.contactName) || "";
          const cNum = resolvedPhone || (rec.contactName ? rec.contactName : "Direct Phone Call");
          const devName = rec.deviceName || (isOnePlus ? 'OnePlus' : 'Samsung Galaxy');
          const newCall = {
            id: `call-rec-${rec.id}`,
            caller_number: cNum,
            phone: cNum,
            caller_name: cName,
            leadName: cName,
            call_type: ((KNOWN_DRIVE_MAPPINGS[rec.id] && KNOWN_DRIVE_MAPPINGS[rec.id].dir) || (KNOWN_OUTBOUND_CONTACTS.some(oc => (cName + ' ' + (rec.name||'')).toLowerCase().includes(oc)) ? 'OUTBOUND' : 'INBOUND')), direction: ((KNOWN_DRIVE_MAPPINGS[rec.id] && KNOWN_DRIVE_MAPPINGS[rec.id].dir) || (KNOWN_OUTBOUND_CONTACTS.some(oc => (cName + ' ' + (rec.name||'')).toLowerCase().includes(oc)) ? 'OUTBOUND' : 'INBOUND')),
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

    // Sanitize any missing phone numbers using KNOWN_CONTACT_PHONES
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
