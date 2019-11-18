const fetch = require("node-fetch");
const fs    = require("fs");

const folderGetData   = './getdata';
const fileAccesstoken = folderGetData + '/accesstoken.txt';
const fileCategories  = folderGetData + '/categories.csv';

async function getAccessToken(){
  const clientId     = '18325940-db11-4ac5-bb1e-bbcafe005ba6';
  const clientSecret = '974FE7232C10209EA1A4A51F84FE9615864FC253';
  const headers      = { "Content-type": "application/x-www-form-urlencoded" }
  const data = `scopes=PublicApi.Access&grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;
 
  let response = await fetch('https://id.kiotviet.vn/connect/token', {method:"POST", headers:headers, body:data});
  let dataJson = await response.json();

  dataJson['expires_time'] = (Date.now() + 86000);
  
  if(!fs.existsSync(folderGetData))
    fs.mkdirSync(folderGetData);

  fs.writeFile(fileAccesstoken, JSON.stringify(dataJson), err => {
    if(err) throw err;
  });
  return dataJson;
}

async function readAccessTokenFile(){
  if(!fs.existsSync(fileAccesstoken)){
    let dataToken = await getAccessToken();
    return dataToken;
  }
  return await promiseReadfile(fileAccesstoken);
}

function promiseReadfile(pathFile){
  return new Promise((resolve, reject) => {
    fs.readFile(pathFile, 'utf8', async (err, data) => {
      if(err) reject(err);
      data = JSON.parse(data);
      if(data['expires_time'] < Date.now()){
        let dataToken = await getAccessToken();
        resolve(dataToken);
      } else {
        resolve(data);
      }
    });
  });
}

function getCategories(){
  readAccessTokenFile().then(async dataToken => {
    const headers = {
      'Authorization' : `${dataToken['token_type']} ${dataToken['access_token']}`,
      'Retailer'      : 'moanashop',
      'Cache-Control' : 'no-cache'
    }
    let response = await fetch('https://public.kiotapi.com/categories', {headers:headers});
    let dataJson = await response.json();

    let content = 'categoryId,parentId,categoryName,retailerId,hasChild,modifiedDate,createdDate\n';

    dataJson['data'].forEach(item => {
      content += item.categoryId   ? item.categoryId   + ',' : ',';
      content += item.parentId     ? item.parentId     + ',' : ',';
      content += item.categoryName ? item.categoryName + ',' : ',';
      content += item.retailerId   ? item.retailerId   + ',' : ',';
      content += item.hasChild     ? item.hasChild     + ',' : ',';
      content += item.modifiedDate ? item.modifiedDate + ',' : ',';
      content += item.createdDate  ? item.createdDate  : '';
      content += '\n';
    });
    
    fs.writeFile(fileCategories, content, err => {
      if(err) throw err;
    });
  });
}

getCategories();
