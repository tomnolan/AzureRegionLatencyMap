// ─────────────────────────────────────────────
//  Azure Maps API Key — replace with your key
// ─────────────────────────────────────────────

const AZURE_MAPS_KEY = '6F6hXIGgXWC649QAdz1Du3wAxCJ6L44x5hH7BcDMdAsyS817KmheJQQJ99CDACYeBjFJ0deGAAAgAZMPofLb';

// ─────────────────────────────────────────────
//  Embedded data (parsed from CSV)
// ─────────────────────────────────────────────

const REGIONS_CSV = `Location,Type,DisplayName,RegionalDisplayName,RegionType,RegionCategory,Geography,GeographyGroup,Longitude,Latitude,PhysicalLocation,PairedRegion,Special Access,AvailabilityZoneSupport,AvailabilityZoneCount
australiacentral,Region,Australia Central,(Asia Pacific) Australia Central,Physical,Other,Australia,Asia Pacific,149.1244,-35.3075,Canberra,australiacentral2,,FALSE,1
australiacentral2,Region,Australia Central 2,(Asia Pacific) Australia Central 2,Physical,Other,Australia,Asia Pacific,149.1244,-35.3075,Canberra,australiacentral,TRUE,FALSE,1
australiaeast,Region,Australia East,(Asia Pacific) Australia East,Physical,Recommended,Australia,Asia Pacific,151.2094,-33.86,New South Wales,australiasoutheast,,TRUE,3
australiasoutheast,Region,Australia Southeast,(Asia Pacific) Australia Southeast,Physical,Other,Australia,Asia Pacific,144.9631,-37.8136,Victoria,australiaeast,,FALSE,1
austriaeast,Region,Austria East,(Europe) Austria East,Physical,Recommended,Austria,Europe,16.3727779,48.2092056,Vienna,,,TRUE,3
belgiumcentral,Region,Belgium Central,(Europe) Belgium Central,Physical,Recommended,Belgium,Europe,4.355707169,50.84553528,Brussels,,,TRUE,3
brazilsouth,Region,Brazil South,(South America) Brazil South,Physical,Recommended,Brazil,South America,-46.633,-23.55,Sao Paulo State,southcentralus,,TRUE,3
brazilsoutheast,Region,Brazil Southeast,(South America) Brazil Southeast,Physical,Other,Brazil,South America,-43.2075,-22.90278,Rio,brazilsouth,TRUE,FALSE,1
canadacentral,Region,Canada Central,(Canada) Canada Central,Physical,Recommended,Canada,Canada,-79.383,43.653,Toronto,canadaeast,,TRUE,3
canadaeast,Region,Canada East,(Canada) Canada East,Physical,Other,Canada,Canada,-71.217,46.817,Quebec,canadacentral,,FALSE,1
centralindia,Region,Central India,(Asia Pacific) Central India,Physical,Recommended,India,Asia Pacific,73.9197,18.5822,Pune,southindia,,TRUE,3
centralus,Region,Central US,(US) Central US,Physical,Recommended,United States,US,-93.6208,41.5908,Iowa,eastus2,,TRUE,3
centraluseuap,Region,Central US EUAP,(US) Central US EUAP,Physical,Other,Canary (US),US,-93.6208,41.5908,,eastus2euap,,FALSE,1
chilecentral,Region,Chile Central,(South America) Chile Central,Physical,Recommended,Chile,South America,-70.673676,-33.447487,Santiago,,,TRUE,3
eastasia,Region,East Asia,(Asia Pacific) East Asia,Physical,Recommended,Asia Pacific,Asia Pacific,114.188,22.267,Hong Kong,southeastasia,,TRUE,3
eastus,Region,East US,(US) East US,Physical,Recommended,United States,US,-79.8164,37.3719,Virginia,westus,,TRUE,3
eastus2,Region,East US 2,(US) East US 2,Physical,Other,United States,US,-78.3889,36.6681,Virginia,centralus,,TRUE,3
eastus2euap,Region,East US 2 EUAP,(US) East US 2 EUAP,Physical,Recommended,Canary (US),US,-78.3889,36.6681,,centraluseuap,,TRUE,4
eastusstg,Region,East US STG,(US) East US STG,Physical,Other,Stage (US),US,-79.8164,37.3719,Virginia,southcentralusstg,,FALSE,1
francecentral,Region,France Central,(Europe) France Central,Physical,Recommended,France,Europe,2.373,46.3772,Paris,francesouth,,TRUE,3
francesouth,Region,France South,(Europe) France South,Physical,Other,France,Europe,2.1972,43.8345,Marseille,francecentral,TRUE,FALSE,1
germanynorth,Region,Germany North,(Europe) Germany North,Physical,Other,Germany,Europe,8.806422,53.073635,Berlin,germanywestcentral,TRUE,FALSE,1
germanywestcentral,Region,Germany West Central,(Europe) Germany West Central,Physical,Recommended,Germany,Europe,8.682127,50.110924,Frankfurt,germanynorth,,TRUE,3
indonesiacentral,Region,Indonesia Central,(Asia Pacific) Indonesia Central,Physical,Recommended,Indonesia,Asia Pacific,106.816666,-6.2,Jakarta,,,TRUE,3
israelcentral,Region,Israel Central,(Middle East) Israel Central,Physical,Recommended,Israel,Middle East,33.4506633,31.2655698,Israel,,,TRUE,3
italynorth,Region,Italy North,(Europe) Italy North,Physical,Recommended,Italy,Europe,9.18109,45.46888,Milan,,,TRUE,3
japaneast,Region,Japan East,(Asia Pacific) Japan East,Physical,Recommended,Japan,Asia Pacific,139.77,35.68,Tokyo,japanwest,,TRUE,3
japanwest,Region,Japan West,(Asia Pacific) Japan West,Physical,Recommended,Japan,Asia Pacific,135.5022,34.6939,Osaka,japaneast,,TRUE,3
jioindiacentral,Region,Jio India Central,(Asia Pacific) Jio India Central,Physical,Other,India,Asia Pacific,79.08886,21.146633,Nagpur,jioindiawest,,FALSE,1
jioindiawest,Region,Jio India West,(Asia Pacific) Jio India West,Physical,Other,India,Asia Pacific,70.05773,22.470701,Jamnagar,jioindiacentral,,FALSE,1
koreacentral,Region,Korea Central,(Asia Pacific) Korea Central,Physical,Recommended,Korea,Asia Pacific,126.978,37.5665,Seoul,koreasouth,,TRUE,3
koreasouth,Region,Korea South,(Asia Pacific) Korea South,Physical,Other,Korea,Asia Pacific,129.0756,35.1796,Busan,koreacentral,,FALSE,1
malaysiawest,Region,Malaysia West,(Asia Pacific) Malaysia West,Physical,Recommended,Malaysia,Asia Pacific,101.693207,3.140853,Kuala Lumpur,,,TRUE,3
mexicocentral,Region,Mexico Central,(Mexico) Mexico Central,Physical,Recommended,Mexico,Mexico,-100.389888,20.588818,Querétaro State,,,TRUE,3
newzealandnorth,Region,New Zealand North,(Asia Pacific) New Zealand North,Physical,Recommended,New Zealand,Asia Pacific,174.76349,-36.84853,Auckland,,,TRUE,3
northcentralus,Region,North Central US,(US) North Central US,Physical,Other,United States,US,-87.6278,41.8819,Illinois,southcentralus,,FALSE,1
northeurope,Region,North Europe,(Europe) North Europe,Physical,Recommended,Europe,Europe,-6.2597,53.3478,Ireland,westeurope,,TRUE,3
norwayeast,Region,Norway East,(Europe) Norway East,Physical,Recommended,Norway,Europe,10.752245,59.913868,Norway,norwaywest,,TRUE,3
norwaywest,Region,Norway West,(Europe) Norway West,Physical,Other,Norway,Europe,5.733107,58.969975,Norway,norwayeast,TRUE,FALSE,1
polandcentral,Region,Poland Central,(Europe) Poland Central,Physical,Recommended,Poland,Europe,21.01666,52.23334,Warsaw,,,TRUE,3
qatarcentral,Region,Qatar Central,(Middle East) Qatar Central,Physical,Recommended,Qatar,Middle East,51.439327,25.551462,Doha,,,TRUE,3
southafricanorth,Region,South Africa North,(Africa) South Africa North,Physical,Recommended,South Africa,Africa,28.21837,-25.73134,Johannesburg,southafricawest,,TRUE,3
southafricawest,Region,South Africa West,(Africa) South Africa West,Physical,Other,South Africa,Africa,18.843266,-34.075691,Cape Town,southafricanorth,TRUE,FALSE,1
southcentralus,Region,South Central US,(US) South Central US,Physical,Other,United States,US,-98.5,29.4167,Texas,northcentralus,,TRUE,3
southcentralusstg,Region,South Central US STG,(US) South Central US STG,Physical,Other,Stage (US),US,-98.5,29.4167,Texas,eastusstg,,FALSE,1
southeastasia,Region,Southeast Asia,(Asia Pacific) Southeast Asia,Physical,Recommended,Asia Pacific,Asia Pacific,103.833,1.283,Singapore,eastasia,,TRUE,3
southindia,Region,South India,(Asia Pacific) South India,Physical,Other,India,Asia Pacific,80.1636,12.9822,Chennai,centralindia,,FALSE,1
spaincentral,Region,Spain Central,(Europe) Spain Central,Physical,Recommended,Spain,Europe,3.4209,40.4259,Madrid,,,TRUE,3
swedencentral,Region,Sweden Central,(Europe) Sweden Central,Physical,Recommended,Sweden,Europe,17.14127,60.67488,Gävle,swedensouth,,TRUE,3
switzerlandnorth,Region,Switzerland North,(Europe) Switzerland North,Physical,Recommended,Switzerland,Europe,8.564572,47.451542,Zurich,switzerlandwest,,TRUE,3
switzerlandwest,Region,Switzerland West,(Europe) Switzerland West,Physical,Other,Switzerland,Europe,6.143158,46.204391,Geneva,switzerlandnorth,TRUE,FALSE,1
uaecentral,Region,UAE Central,(Middle East) UAE Central,Physical,Other,UAE,Middle East,54.366669,24.466667,Abu Dhabi,uaenorth,TRUE,FALSE,1
uaenorth,Region,UAE North,(Middle East) UAE North,Physical,Recommended,UAE,Middle East,55.316666,25.266666,Dubai,uaecentral,,TRUE,3
uksouth,Region,UK South,(UK) UK South,Physical,Recommended,United Kingdom,UK,-0.799,50.941,London,ukwest,,TRUE,3
ukwest,Region,UK West,(UK) UK West,Physical,Other,United Kingdom,UK,-3.084,53.427,Cardiff,uksouth,,FALSE,1
westcentralus,Region,West Central US,(US) West Central US,Physical,Other,United States,US,-110.234,40.89,Wyoming,westus2,,FALSE,1
westeurope,Region,West Europe,(Europe) West Europe,Physical,Recommended,Europe,Europe,4.9,52.3667,Netherlands,northeurope,,TRUE,3
westindia,Region,West India,(Asia Pacific) West India,Physical,Other,India,Asia Pacific,72.868,19.088,Mumbai,southindia,,FALSE,1
westus,Region,West US,(US) West US,Physical,Other,United States,US,-122.417,37.783,California,eastus,,FALSE,1
westus2,Region,West US 2,(US) West US 2,Physical,Recommended,United States,US,-119.852,47.233,Washington,westcentralus,,TRUE,3
westus3,Region,West US 3,(US) West US 3,Physical,Other,United States,US,-112.074036,33.448376,Phoenix,eastus,,TRUE,3`;

const LATENCY_CSV = `
Source,Australia Central,Australia Central 2,Australia East,Australia Southeast,Brazil South,Canada Central,Canada East,Central India,Central US,East Asia,East US,East US 2,France Central,France South,Germany North,Germany West Central,Israel Central,Italy North,Japan East,Japan West,Jio India West,Korea Central,Korea South,Malaysia West,Mexico Central,New Zealand North,North Central US,North Europe,Norway East,Norway West,Poland Central,Qatar Central,South Africa North,South Africa West,South Central US,South India,Southeast Asia,Sweden Central,Switzerland North,Switzerland West,UAE Central,UAE North,UK South,UK West,West Central US,West Europe,West India,West US,West US 2,West US 3
Australia Central,,3,8,16,302,203,211,152,178,122,202,197,245,234,257,251,293,243,107,115,,129,123,102,183,32,188,260,270,267,266,186,273,293,167,131,98,293,245,241,173,176,251,256,166,254,144,147,166,150
Australia Central 2,4,,8,13,303,204,212,154,179,123,202,198,245,234,257,251,306,243,108,115,,129,123,102,183,32,188,260,270,267,266,185,273,293,167,130,98,294,245,241,173,176,251,256,166,254,144,147,167,151
Australia East,8,8,,16,299,201,208,152,176,123,199,193,241,230,254,247,289,239,104,111,,126,119,99,180,28,184,256,266,263,263,184,270,289,163,127,94,294,242,237,169,172,247,253,161,250,140,141,162,147
Australia Southeast,16,12,16,,311,213,221,144,188,119,212,207,236,225,248,241,291,233,114,121,,138,130,92,192,40,197,250,260,257,257,176,264,283,176,121,88,281,236,231,163,166,241,247,173,244,134,151,173,159
Brazil South,302,302,298,311,,131,134,331,151,321,119,118,190,186,194,195,239,194,271,278,,294,286,337,157,288,138,172,196,193,202,319,319,303,141,300,332,215,197,192,283,285,180,184,157,186,283,176,178,163
Canada Central,202,203,201,212,130,,14,244,28,211,21,23,99,96,106,106,153,105,159,166,,181,175,226,72,187,17,85,108,104,114,229,231,215,50,211,222,126,107,102,195,195,91,92,39,97,194,64,59,70
Canada East,212,212,210,221,135,15,,245,37,220,34,38,104,100,110,110,157,109,168,175,,190,183,235,83,196,26,87,112,109,118,233,241,224,58,215,231,126,111,107,198,200,96,97,48,101,198,71,68,76
Central India,153,154,153,145,329,244,244,,240,89,235,234,123,122,136,131,181,132,128,128,,126,122,57,256,191,237,139,160,158,156,46,205,223,247,22,56,202,134,132,41,40,129,142,244,145,5,228,221,244
Central US,177,177,175,187,150,27,36,239,,187,29,37,118,115,124,124,170,123,135,143,,157,152,202,47,162,15,102,126,124,133,249,245,229,29,231,198,142,125,119,213,215,111,112,18,115,214,41,39,47
East Asia,122,122,122,118,320,211,219,90,187,,216,216,182,170,193,187,224,179,53,50,,41,33,35,200,142,197,196,206,203,202,123,209,229,179,66,36,225,182,177,108,111,187,192,173,190,80,159,151,163
East US,200,200,198,211,117,20,32,234,28,214,,10,86,83,92,93,137,92,163,171,,185,179,226,54,183,19,70,95,91,101,212,217,200,36,198,222,111,94,89,182,183,78,80,50,83,181,71,68,59
East US 2,195,195,193,204,116,23,36,233,36,215,10,,84,87,96,90,133,95,167,171,,189,178,236,49,181,26,76,99,95,104,214,212,196,31,202,228,113,98,94,187,187,81,84,48,88,185,66,69,53
France Central,244,245,241,236,190,100,103,123,120,182,88,85,,15,18,12,53,21,214,217,,212,207,153,129,262,104,19,30,27,29,141,156,140,111,130,148,40,17,13,112,114,11,15,130,13,113,153,152,135
France South,234,234,230,225,186,96,100,122,116,171,84,89,15,,26,20,41,12,203,206,,201,196,143,132,258,101,29,38,36,37,117,154,138,117,118,139,48,14,10,102,103,20,25,130,23,102,153,150,137
Germany North,258,257,254,248,194,107,110,142,125,194,95,98,19,27,,11,64,22,240,229,,225,219,169,142,276,111,27,20,26,16,150,170,153,125,141,165,31,16,19,125,126,21,23,139,15,125,162,160,147
Germany West Central,250,250,247,241,195,106,109,130,124,187,94,92,12,19,10,,57,14,219,222,,217,212,161,138,272,110,26,22,25,22,143,162,146,119,134,157,34,9,12,118,119,17,22,136,12,117,159,158,142
Indonesia Central,110,110,107,100,343,235,243,68,212,49,238,243,165,154,177,170,199,162,85,82,87,77,72,21,234,131,221,179,189,186,,,193,211,216,50,17,,165,160,92,95,171,176,197,173,,183,176,200
Israel Central,291,306,288,291,239,154,155,179,171,224,139,135,52,41,63,57,,49,257,259,,269,266,207,191,314,157,78,83,78,72,154,198,187,172,176,184,94,51,53,143,151,210,211,182,66,151,204,212,197
Italy North,242,242,239,233,194,105,109,131,123,179,93,97,21,12,20,14,49,,211,214,,209,204,153,140,266,111,35,33,35,31,121,162,146,125,127,149,48,9,10,110,111,27,32,138,23,110,160,159,144
Japan East,107,107,103,114,270,159,167,126,136,53,164,166,214,202,239,219,257,211,,12,,29,20,76,149,127,145,232,247,234,249,163,249,268,129,106,73,277,213,209,148,151,230,234,121,234,119,107,100,113
Japan West,114,114,110,120,277,166,174,127,143,49,172,171,216,205,228,221,258,213,12,,,18,13,73,157,135,152,239,240,237,237,160,244,263,136,101,69,263,216,211,143,146,222,227,128,224,114,115,107,120
Jio India West,,,,,,,,,,,,,,,,,200,150,,,,,,76,282,212,,,,,166,,,,,,,,,,,,,,,,,,,
Korea Central,129,129,126,138,294,181,189,123,158,41,187,192,213,201,224,218,269,210,29,19,,,8,69,171,150,168,227,236,233,233,160,240,259,154,97,65,273,212,208,139,142,218,223,144,220,111,130,123,136
Korea South,123,123,119,130,286,175,183,123,152,33,180,180,207,195,219,212,267,204,21,14,,8,,64,164,144,162,221,231,228,227,156,235,254,145,92,59,260,207,202,134,137,212,218,137,215,105,124,116,129
Malaysia West,102,101,99,92,336,227,234,58,203,35,228,235,154,143,168,162,207,154,77,73,76,69,64,,225,122,212,170,180,177,,,178,197,208,35,9,,156,150,77,80,159,165,188,164,,175,167,191
Mexico Central,182,182,179,191,156,72,82,255,47,199,55,50,128,131,140,137,190,139,148,156,,170,162,224,,169,56,117,142,139,148,270,257,240,24,252,220,164,142,137,228,230,127,131,44,132,229,52,73,40
New Zealand North,31,31,28,40,286,187,195,192,162,142,185,182,262,256,276,271,316,266,127,134,211,150,143,122,169,,172,251,278,286,,,293,312,151,150,118,,269,265,192,195,262,263,147,267,,132,137,134
North Central US,187,187,184,196,138,18,26,237,15,197,20,26,104,101,110,110,156,111,145,152,,167,161,213,56,172,,89,112,111,119,237,234,218,41,218,208,130,112,107,200,202,96,100,27,102,201,51,47,58
North Europe,259,259,256,250,171,85,87,139,102,196,74,77,20,29,27,26,78,36,233,240,,227,221,170,118,248,89,,28,26,35,136,170,153,101,144,166,38,31,35,127,128,13,17,116,18,127,139,137,125
Norway East,269,269,266,260,196,109,111,159,126,206,97,101,31,38,20,23,83,34,248,241,,236,231,180,143,278,113,28,,10,28,159,182,165,125,153,176,17,28,31,137,138,24,28,140,23,136,163,161,148
Norway West,267,266,263,257,193,105,109,158,125,203,93,98,27,36,26,26,79,36,235,238,,234,228,178,141,286,112,26,10,,34,161,178,161,125,151,174,20,31,35,134,135,17,22,138,19,135,161,159,146
Poland Central,266,266,263,257,202,115,118,153,133,202,102,106,29,36,16,22,73,32,249,238,,233,228,177,150,285,121,35,28,34,,158,178,162,132,150,173,29,26,29,133,135,29,31,147,22,133,170,168,155
Qatar Central,186,184,184,175,317,230,233,47,250,123,215,215,141,116,149,142,154,121,163,161,,160,156,89,273,227,238,136,157,160,158,,190,210,257,56,94,173,131,124,16,20,146,152,260,147,36,267,255,264
South Africa North,273,272,269,263,319,231,240,205,248,209,218,213,156,154,169,162,198,162,249,245,,240,234,178,258,293,235,170,181,177,178,190,,20,239,146,180,197,164,160,105,102,161,163,257,164,129,274,277,263
South Africa West,292,292,289,283,303,216,224,223,230,229,202,198,140,138,153,146,182,146,269,264,,259,254,197,242,312,219,154,165,161,162,210,21,,224,166,199,180,148,144,124,122,145,147,240,148,149,256,261,247
South Central US,165,165,162,174,139,51,59,246,28,178,36,32,110,114,122,118,170,123,129,136,,153,144,207,24,150,40,100,124,122,131,255,239,222,,235,202,143,125,120,212,214,108,113,25,114,212,36,50,24
South India,131,130,127,121,300,212,215,23,232,67,200,204,130,118,141,135,177,127,106,102,,98,92,35,253,151,219,144,153,151,150,57,147,166,236,,38,188,129,125,46,49,135,137,217,138,17,203,196,220
Southeast Asia,97,97,94,88,332,222,230,56,199,36,224,231,148,138,164,157,184,149,73,69,,65,59,9,221,118,209,166,176,173,173,94,180,199,203,37,,201,152,147,79,82,155,161,184,160,50,171,163,187
Sweden Central,294,295,297,282,217,126,127,204,143,223,113,114,41,49,32,34,95,49,278,261,,270,259,204,165,310,132,34,16,21,31,175,199,180,144,187,202,,43,47,154,167,38,41,158,36,168,180,184,168
Switzerland North,245,245,241,236,196,108,111,133,127,182,96,100,17,14,16,9,51,9,214,217,,212,207,156,143,269,114,31,28,31,26,135,165,148,126,129,152,43,,7,112,114,23,28,141,18,112,163,162,146
Switzerland West,241,240,237,231,192,103,106,130,122,177,91,96,14,10,19,13,54,11,209,212,,208,202,150,139,264,108,35,31,34,30,124,161,144,123,125,147,46,7,,108,109,19,24,136,21,108,159,156,142
UAE Central,172,172,169,163,283,195,198,41,214,109,183,188,113,101,124,118,143,110,148,144,,139,134,77,229,193,201,127,136,134,133,16,105,124,214,45,79,155,113,108,,6,118,123,228,121,29,250,243,235
UAE North,175,175,172,166,284,196,200,39,216,112,184,189,114,102,126,119,151,111,152,147,,142,137,80,231,195,202,128,138,135,134,20,103,121,215,48,82,168,114,109,6,,119,125,229,122,32,252,249,236
UK South,251,250,247,241,180,92,96,129,111,187,79,83,11,20,21,17,210,28,231,222,,218,213,159,128,263,97,13,24,17,29,148,161,145,110,135,155,37,23,19,118,120,,7,125,12,118,147,145,133
UK West,256,255,252,246,183,93,97,142,112,192,81,85,15,25,22,22,212,32,234,227,,223,218,165,132,263,99,16,28,22,31,152,163,147,114,137,161,40,28,24,123,125,7,,127,15,120,150,149,135
West Central US,165,166,162,172,156,40,48,243,19,173,54,49,131,130,138,136,182,138,121,129,,144,137,189,45,148,28,116,140,138,147,261,257,240,27,217,184,157,140,136,229,230,125,127,,129,229,26,25,35
West Europe,254,254,251,245,186,98,101,146,116,191,85,90,15,24,14,13,67,24,235,226,,221,216,164,133,267,104,18,23,20,23,148,165,149,116,139,161,36,19,22,122,123,12,15,130,,122,153,151,139
West US,146,146,140,150,176,65,70,227,42,159,73,68,153,152,161,159,204,161,108,115,,130,124,175,53,133,51,138,163,160,170,267,273,255,36,203,171,179,163,159,250,252,147,150,26,153,216,,25,20
West US 2,166,166,161,172,177,60,68,220,40,152,69,70,153,146,159,159,208,159,100,108,,123,116,168,74,137,48,137,161,158,168,254,278,261,53,196,163,184,160,156,244,249,145,148,25,150,209,25,,41
West US 3,150,150,147,159,163,73,79,243,48,163,60,54,135,138,147,142,199,146,113,120,,136,128,190,41,133,59,124,148,145,154,264,263,247,25,219,187,168,147,142,235,236,133,134,35,138,232,20,41,
`;

// ─────────────────────────────────────────────
//  CSV parsing
// ─────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}

// Parse regions
const regionRows = parseCSV(REGIONS_CSV);
const regionMap = {}; // DisplayName -> row
regionRows.forEach(r => { regionMap[r.DisplayName] = r; });

// Parse latency: build full bidirectional connections array and a lookup map
const latencyLines = LATENCY_CSV.trim().split('\n');
const latencyHeaders = latencyLines[0].split(',').slice(1).map(h => h.trim());
const latencyLookup = {}; // source -> target -> ms
const connections = [];

latencyLines.slice(1).forEach(line => {
  const vals = line.split(',');
  const source = vals[0].trim();
  latencyHeaders.forEach((target, i) => {
    const raw = (vals[i + 1] || '').trim();
    if (raw === '' || source === target) return;
    const ms = parseInt(raw, 10);
    if (isNaN(ms)) return;
    if (!latencyLookup[source]) latencyLookup[source] = {};
    latencyLookup[source][target] = ms;
    connections.push({ source, target, latency: ms });
  });
});

// ─────────────────────────────────────────────
//  Map state
// ─────────────────────────────────────────────

let map = null;
let datasource = null;
let pointDatasource = null;
let initialized = false;
let selectedNode = null;
let selectedLine = null; // 'source|target' sorted key
let currentFiltered = [];

// ─────────────────────────────────────────────
//  Color by latency
// ─────────────────────────────────────────────

function latencyColor(ms) {
  if (ms < 50)  return '#00e676';
  if (ms < 100) return '#ffee58';
  if (ms < 200) return '#ffa726';
  return '#ef5350';
}

function latencyWidth(ms) {
  if (ms < 50)  return 4;
  if (ms < 100) return 3;
  if (ms < 200) return 2.5;
  return 1.5;
}

// ─────────────────────────────────────────────
//  Filter panel population
// ─────────────────────────────────────────────

function populateFilters() {
  const geoGroups = [...new Set(regionRows.map(r => r.GeographyGroup).filter(Boolean))].sort();
  const geos      = [...new Set(regionRows.map(r => r.Geography).filter(Boolean))].sort();
  const allNames  = regionRows.map(r => r.DisplayName).filter(Boolean).sort();

  ['src-geo-group', 'dst-geo-group'].forEach(id => {
    const sel = document.getElementById(id);
    geoGroups.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g; opt.textContent = g;
      sel.appendChild(opt);
    });
  });

  ['src-geo', 'dst-geo'].forEach(id => {
    const sel = document.getElementById(id);
    geos.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g; opt.textContent = g;
      sel.appendChild(opt);
    });
  });

  populateRegionList('src-region-list', allNames);
  populateRegionList('dst-region-list', allNames);
}

function populateRegionList(containerId, names) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  names.forEach(name => {
    const item = document.createElement('label');
    item.className = 'multiselect-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = name;
    cb.checked = true;
    item.appendChild(cb);
    item.appendChild(document.createTextNode(name));
    container.appendChild(item);
  });
}

// Helper: repopulate a geo dropdown based on a geo-group value
function repopulateGeoSelect(geoSelId, geoGroupVal) {
  const sel = document.getElementById(geoSelId);
  const prev = sel.value;
  sel.innerHTML = '<option value="">All Geographies</option>';
  const geos = [...new Set(
    regionRows
      .filter(r => !geoGroupVal || r.GeographyGroup === geoGroupVal)
      .map(r => r.Geography).filter(Boolean)
  )].sort();
  geos.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g; opt.textContent = g;
    sel.appendChild(opt);
  });
  if (geos.includes(prev)) sel.value = prev;
}

// Helper: repopulate a region list based on geo-group + geo values
function repopulateRegionList(listId, geoGroupVal, geoVal) {
  const names = regionRows
    .filter(r => {
      if (geoGroupVal && r.GeographyGroup !== geoGroupVal) return false;
      if (geoVal      && r.Geography      !== geoVal)      return false;
      return true;
    })
    .map(r => r.DisplayName).filter(Boolean).sort();
  populateRegionList(listId, names);
}

// Source cascades
document.getElementById('src-geo-group').addEventListener('change', function () {
  repopulateGeoSelect('src-geo', this.value);
  repopulateRegionList('src-region-list', this.value, document.getElementById('src-geo').value);
});
document.getElementById('src-geo').addEventListener('change', function () {
  repopulateRegionList('src-region-list', document.getElementById('src-geo-group').value, this.value);
});

// Destination cascades
document.getElementById('dst-geo-group').addEventListener('change', function () {
  repopulateGeoSelect('dst-geo', this.value);
  repopulateRegionList('dst-region-list', this.value, document.getElementById('dst-geo').value);
});
document.getElementById('dst-geo').addEventListener('change', function () {
  repopulateRegionList('dst-region-list', document.getElementById('dst-geo-group').value, this.value);
});

// ─────────────────────────────────────────────
//  Map rendering
// ─────────────────────────────────────────────

function getCheckedSet(listId) {
  const checkboxes = document.querySelectorAll(`#${listId} input[type="checkbox"]`);
  const checked = new Set();
  checkboxes.forEach(cb => { if (cb.checked) checked.add(cb.value); });
  const total = checkboxes.length;
  return (checked.size === 0 || checked.size === total) ? null : checked;
}

// Build a Set of region DisplayNames that pass a side's geo-group + geo + checkbox filters
function buildSideSet(geoGroupId, geoId, listId) {
  const geoGroupVal = document.getElementById(geoGroupId).value;
  const geoVal      = document.getElementById(geoId).value;
  const checkedSet  = getCheckedSet(listId);

  return new Set(
    regionRows
      .filter(r => {
        if (geoGroupVal && r.GeographyGroup !== geoGroupVal) return false;
        if (geoVal      && r.Geography      !== geoVal)      return false;
        if (checkedSet  && !checkedSet.has(r.DisplayName))   return false;
        return true;
      })
      .map(r => r.DisplayName)
  );
}

// Build a quadratic-Bézier approximation between two lon/lat points.
// The control point is offset perpendicular to the midpoint, giving a subtle arc.
function curvedLine(lon1, lat1, lon2, lat2, steps = 48, curvature = 0.15) {
  const mx = (lon1 + lon2) / 2;
  const my = (lat1 + lat2) / 2;
  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
  // Perpendicular unit direction scaled by curvature
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    coords.push([
      u * u * lon1 + 2 * u * t * cx + t * t * lon2,
      u * u * lat1 + 2 * u * t * cy + t * t * lat2,
    ]);
  }
  return coords;
}

function renderConnections() {
  if (!datasource) return;

  datasource.clear();
  pointDatasource.clear();

  const srcSet = buildSideSet('src-geo-group', 'src-geo', 'src-region-list');
  const dstSet = buildSideSet('dst-geo-group', 'dst-geo', 'dst-region-list');

  const latMin = parseFloat(document.getElementById('lat-min').value) || null;
  const latMax = parseFloat(document.getElementById('lat-max').value) || null;

  // Filter connections: one endpoint must match src, other must match dst (either direction)
  const filtered = connections.filter(c => {
    const aInSrc = srcSet.has(c.source), aInDst = dstSet.has(c.source);
    const bInSrc = srcSet.has(c.target), bInDst = dstSet.has(c.target);
    if (!((aInSrc && bInDst) || (bInSrc && aInDst))) return false;
    if (latMin !== null && c.latency < latMin) return false;
    if (latMax !== null && c.latency > latMax) return false;
    return true;
  });

  // Track which regions appear in filtered connections
  const activeRegionNames = new Set();
  filtered.forEach(c => { activeRegionNames.add(c.source); activeRegionNames.add(c.target); });

  // Add line features — deduplicate pairs so only one line is drawn per pair
  const drawnPairs = new Set();
  filtered.forEach(c => {
    const pairKey = [c.source, c.target].sort().join('|');
    if (drawnPairs.has(pairKey)) return;
    drawnPairs.add(pairKey);

    const srcReg = regionMap[c.source];
    const tgtReg = regionMap[c.target];
    if (!srcReg || !tgtReg) return;

    const srcLon = parseFloat(srcReg.Longitude);
    const srcLat = parseFloat(srcReg.Latitude);
    const tgtLon = parseFloat(tgtReg.Longitude);
    const tgtLat = parseFloat(tgtReg.Latitude);

    if (isNaN(srcLon) || isNaN(srcLat) || isNaN(tgtLon) || isNaN(tgtLat)) return;

    const dimmed = (selectedNode !== null &&
      c.source !== selectedNode && c.target !== selectedNode) ||
      (selectedLine !== null &&
      [c.source, c.target].sort().join('|') !== selectedLine);
    const fwdLatency = latencyLookup[c.source]?.[c.target];
    const revLatency = latencyLookup[c.target]?.[c.source];
    // Use the average for color/width when both directions exist
    const repLatency = (fwdLatency !== undefined && revLatency !== undefined)
      ? Math.round((fwdLatency + revLatency) / 2)
      : (fwdLatency ?? revLatency ?? c.latency);
    datasource.add(new atlas.data.Feature(
      new atlas.data.LineString(curvedLine(srcLon, srcLat, tgtLon, tgtLat)),
      {
        source: c.source,
        target: c.target,
        latency: fwdLatency,
        latencyReverse: revLatency,
        color: dimmed ? '#333333' : latencyColor(repLatency),
        strokeWidth: latencyWidth(repLatency),
        opacity: dimmed ? 0.2 : 0.65,
      }
    ));
  });

  // Add point features for active regions
  regionRows.forEach(r => {
    if (!activeRegionNames.has(r.DisplayName)) return;
    const lon = parseFloat(r.Longitude);
    const lat = parseFloat(r.Latitude);
    if (isNaN(lon) || isNaN(lat)) return;

    pointDatasource.add(new atlas.data.Feature(
      new atlas.data.Point([lon, lat]),
      {
        name: r.DisplayName,
        geography: r.Geography,
        geoGroup: r.GeographyGroup,
        physicalLocation: r.PhysicalLocation,
      }
    ));
  });

  document.getElementById('stat-lines').textContent = filtered.length.toLocaleString();
  document.getElementById('stat-regions').textContent = activeRegionNames.size;
  currentFiltered = filtered.slice();
}

// ─────────────────────────────────────────────
//  Initialize map
// ─────────────────────────────────────────────

function initMap(apiKey) {
  map = new atlas.Map('map', {
    authOptions: {
      authType: 'subscriptionKey',
      subscriptionKey: apiKey,
    },
    style: 'night',
    center: [20, 20],
    zoom: 1.8,
    language: 'en-US',
  });

  map.events.add('ready', () => {
    document.getElementById('loading').style.display = 'none';

    datasource = new atlas.source.DataSource();
    pointDatasource = new atlas.source.DataSource();
    map.sources.add(datasource);
    map.sources.add(pointDatasource);

    // Line layer
    const lineLayer = new atlas.layer.LineLayer(datasource, 'lines', {
      strokeColor: ['get', 'color'],
      strokeWidth: ['get', 'strokeWidth'],
      strokeOpacity: ['get', 'opacity'],
    });

    // Point layer
    const pointLayer = new atlas.layer.BubbleLayer(pointDatasource, 'points', {
      radius: 5,
      color: '#00d4ff',
      strokeColor: '#ffffff',
      strokeWidth: 1.5,
      opacity: 0.9,
    });

    map.layers.add(lineLayer);
    map.layers.add(pointLayer);

    // Hover on lines
    map.events.add('mousemove', lineLayer, (e) => {
      if (e.shapes && e.shapes.length > 0) {
        const props = e.shapes[0].getProperties();
        const pairKey = [props.source, props.target].sort().join('|');
        const dimmed = (selectedNode !== null &&
          props.source !== selectedNode && props.target !== selectedNode) ||
          (selectedLine !== null && pairKey !== selectedLine);
        if (dimmed) { if (!selectedLine) hideTooltip(); map.getCanvas().style.cursor = ''; return; }
        // Don't override a pinned tooltip from a click
        if (selectedLine && pairKey === selectedLine) { map.getCanvas().style.cursor = 'pointer'; return; }
        showTooltip(e, props);
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    map.events.add('mouseleave', lineLayer, () => {
      // Only hide tooltip if no line is pinned
      if (!selectedLine) hideTooltip();
      map.getCanvas().style.cursor = '';
    });

    // Click on a line to pin/unpin its tooltip and gray out everything else
    map.events.add('click', lineLayer, (e) => {
      // Mark synchronously so the background click handler skips this event
      if (e.originalEvent) e.originalEvent._lineHandled = true;
      // Defer so pointLayer click fires first and can set _nodeHandled
      setTimeout(() => {
        if (e.originalEvent && e.originalEvent._nodeHandled) return;
        if (e.shapes && e.shapes.length > 0) {
          const props = e.shapes[0].getProperties();
          const pairKey = [props.source, props.target].sort().join('|');
          if (selectedLine === pairKey) {
            selectedLine = null;
            hideTooltip();
          } else {
            selectedLine = pairKey;
            selectedNode = null;
            showTooltip(e, props);
          }
          renderConnections();
        }
      }, 0);
    });

    // Hover on points
    map.events.add('mousemove', pointLayer, (e) => {
      if (e.shapes && e.shapes.length > 0) {
        const props = e.shapes[0].getProperties();
        showPointTooltip(e, props);
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    map.events.add('mouseleave', pointLayer, () => {
      hideTooltip();
      map.getCanvas().style.cursor = '';
    });

    // Click on a point node to highlight/unhighlight its connections
    map.events.add('click', pointLayer, (e) => {
      if (e.shapes && e.shapes.length > 0) {
        // Mark this event so the line click handler ignores it
        if (e.originalEvent) e.originalEvent._nodeHandled = true;
        const name = e.shapes[0].getProperties().name;
        selectedLine = null;
        hideTooltip();
        selectedNode = selectedNode === name ? null : name;
        renderConnections();
      }
    });

    // Click on map background to clear all selections
    map.events.add('click', (e) => {
      if (e.originalEvent && (e.originalEvent._nodeHandled || e.originalEvent._lineHandled)) return;
      if (selectedNode !== null || selectedLine !== null) {
        selectedNode = null;
        selectedLine = null;
        hideTooltip();
        renderConnections();
      }
    });

    initialized = true;
    renderConnections();
  });

  map.events.add('error', (err) => {
    console.error('Azure Maps error:', err);
    document.getElementById('loading').style.display = 'none';
  });
}

// ─────────────────────────────────────────────
//  Tooltip
// ─────────────────────────────────────────────

const tooltip = document.getElementById('tooltip');

function showTooltip(e, props) {
  document.getElementById('tt-title').textContent = `${props.source} \u2194 ${props.target}`;
  const fwd = props.latency !== undefined ? `${props.source} \u2192 ${props.target}: ${props.latency} ms` : '';
  const rev = props.latencyReverse !== undefined ? `${props.target} \u2192 ${props.source}: ${props.latencyReverse} ms` : '';
  document.getElementById('tt-latency').textContent = fwd;
  document.getElementById('tt-latency-rev').textContent = rev;
  document.getElementById('tt-sub').textContent = '';

  positionTooltip(e);
  tooltip.style.display = 'block';
}

function showPointTooltip(e, props) {
  document.getElementById('tt-title').textContent = props.name;
  document.getElementById('tt-latency').textContent = '';
  document.getElementById('tt-latency-rev').textContent = '';
  document.getElementById('tt-sub').textContent =
    [props.physicalLocation, props.geography, props.geoGroup].filter(Boolean).join(' · ');

  positionTooltip(e);
  tooltip.style.display = 'block';
}

function positionTooltip(e) {
  const mapContainer = document.getElementById('map-container');
  const rect = mapContainer.getBoundingClientRect();
  let x = e.originalEvent.clientX - rect.left + 14;
  let y = e.originalEvent.clientY - rect.top - 10;

  const tw = tooltip.offsetWidth || 200;
  const th = tooltip.offsetHeight || 80;
  if (x + tw > mapContainer.offsetWidth - 10) x = x - tw - 28;
  if (y + th > mapContainer.offsetHeight - 10) y = mapContainer.offsetHeight - th - 10;

  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
  document.getElementById('tt-latency-rev').textContent = '';
}

// ─────────────────────────────────────────────
//  Table modal
// ─────────────────────────────────────────────

function openTableModal() {
  const rows = selectedNode
    ? currentFiltered.filter(c => c.source === selectedNode || c.target === selectedNode)
    : currentFiltered;
  const title = selectedNode
    ? `Connections for ${selectedNode}`
    : `All Connections (${rows.length.toLocaleString()})`;
  document.getElementById('table-modal-title').textContent = title;

  // Collect unique sorted sources and destinations
  const sources = [...new Set(rows.map(c => c.source))].sort();
  const dests   = [...new Set(rows.map(c => c.target))].sort();

  // Build lookup: source → dest → latency
  const lookup = {};
  rows.forEach(c => {
    if (!lookup[c.source]) lookup[c.source] = {};
    lookup[c.source][c.target] = c.latency;
  });

  // Build header row
  const thead = document.getElementById('data-table-head');
  thead.innerHTML = '';
  const hr = document.createElement('tr');
  const th0 = document.createElement('th');
  th0.textContent = 'Source';
  th0.className = 'col-source';
  hr.appendChild(th0);
  dests.forEach(d => {
    const th = document.createElement('th');
    th.textContent = d;
    th.className = 'col-dest';
    hr.appendChild(th);
  });
  thead.appendChild(hr);

  // Build body rows
  const tbody = document.getElementById('data-table-body');
  tbody.innerHTML = '';
  sources.forEach(src => {
    const tr = document.createElement('tr');
    const td0 = document.createElement('td');
    td0.textContent = src;
    td0.className = 'src-cell';
    tr.appendChild(td0);
    dests.forEach(dst => {
      const td = document.createElement('td');
      const lat = lookup[src] && lookup[src][dst];
      if (lat !== undefined) {
        td.textContent = lat;
        td.style.color = latencyColor(lat);
        td.className = 'lat-cell';
      } else {
        td.textContent = '–';
        td.className = 'lat-cell empty-cell';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  document.getElementById('table-modal').style.display = 'flex';
}

document.getElementById('btn-table').addEventListener('click', openTableModal);

document.getElementById('btn-table-close').addEventListener('click', () => {
  document.getElementById('table-modal').style.display = 'none';
});

document.getElementById('table-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('table-modal')) {
    document.getElementById('table-modal').style.display = 'none';
  }
});

// ─────────────────────────────────────────────
//  Filter button handlers
// ─────────────────────────────────────────────

document.getElementById('btn-apply').addEventListener('click', () => {
  if (initialized) renderConnections();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  ['src-geo-group', 'dst-geo-group'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('lat-min').value = '';
  document.getElementById('lat-max').value = '';

  const allGeos  = [...new Set(regionRows.map(r => r.Geography).filter(Boolean))].sort();
  const allNames = regionRows.map(r => r.DisplayName).filter(Boolean).sort();

  ['src-geo', 'dst-geo'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">All Geographies</option>';
    allGeos.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g; opt.textContent = g;
      sel.appendChild(opt);
    });
  });

  populateRegionList('src-region-list', allNames);
  populateRegionList('dst-region-list', allNames);

  if (initialized) renderConnections();
});

// ─────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────

populateFilters();
initMap(AZURE_MAPS_KEY);
