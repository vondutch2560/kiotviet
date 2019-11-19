const fetch = require("node-fetch");
const fs    = require("fs");
const queryString = require('querystring');

const folderGetData   = './getdata';

const fileAccesstoken = folderGetData + '/accesstoken.txt';
const fileCategories  = folderGetData + '/categories.csv';
const fileProducts    = folderGetData + '/products.csv';
const fileOrders      = folderGetData + '/orders.csv';
const fileCustomers   = folderGetData + '/customers.csv';

const urlApiAccessToken = 'https://id.kiotviet.vn/connect/token';
const urlApiCategories  = 'https://public.kiotapi.com/categories?';
const urlApiProducts    = 'https://public.kiotapi.com/products?';
const urlApiOrders      = 'https://public.kiotapi.com/orders?';
const urlApiCustomers   = 'https://public.kiotapi.com/customers?';

const clientId     = '18325940-db11-4ac5-bb1e-bbcafe005ba6';
const clientSecret = '974FE7232C10209EA1A4A51F84FE9615864FC253';

async function getAccessToken(){
  const headers = { "Content-type": "application/x-www-form-urlencoded" }
  const data    = `scopes=PublicApi.Access&grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;
 
  let response = await fetch(urlApiAccessToken, {method:"POST", headers:headers, body:data});
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

function getHeaderApi(dataToken){
  return {
    'Authorization' : `${dataToken['token_type']} ${dataToken['access_token']}`,
    'Retailer'      : 'moanashop',
    'Cache-Control' : 'no-cache'
  }
}

function getContentFromDataJson(titleHeaders, dataJson){
  let contentFromDataJson = titleHeaders.toString().concat('\n');
  
  dataJson['data'].forEach(data => {
    titleHeaders.forEach((item, index, arr) => {
      if(index === arr.length - 1)
        contentFromDataJson += data[item] ? `"${data[item]}"\n` : "\n";
      else
        contentFromDataJson += data[item] ? `"${data[item]}",` : ",";
    });
  });
  return contentFromDataJson.trim();
}

function writeFile(fileName, content){
    fs.writeFile(fileName, content, err => {
      if(err) throw err;
    });
}

function chainAction(urlApi, params, titleHeaders, writeFileName){
  readAccessTokenFile().then(async dataToken => {
    const headers = getHeaderApi(dataToken);

    let response = await fetch(urlApi + params, {headers:headers});
    let dataJson = await response.json();

    let content = getContentFromDataJson(titleHeaders, dataJson);
    writeFile(writeFileName, content);
  });
}

function getCategories(){
  const params = queryString.stringify({
    // pageSize : 10
  });
  const titleHeaders = ['categoryId', 'parentId', 'categoryName', 
                        'retailerId', 'hasChild', 'modifiedDate', 
                        'createdDate'];
                        
  chainAction(urlApiCategories, params, titleHeaders, fileCategories);
}

function getProducts(){
  const params = queryString.stringify({
    // pageSize : 10
  });
  const titleHeaders = ['id', 'retailerId', 'code', 'name', 'fullname',
                        'categoryId', 'categoryName', 'allowsSale', 'type',
                        'hasVariants', 'basePrice', 'conversionValue', 'description', 
                        'isActive', 'orderTemplate', 'isLotSerialControl', 'isBatchExpireControl', 
                        'createdDate', 'modifiedDate'];
                        
  chainAction(urlApiProducts, params, titleHeaders, fileProducts);
}

function getOrders(){
  const params = queryString.stringify({
    // pageSize : 10
  });
  const titleHeaders = ['id', 'code', 'name', 'gender', 'birthDate',
                        'contactNumber', 'address', 'retailerId', 'branchId',
                        'locationName', 'email', 'type', 'organization', 
                        'taxCode', 'comments', 'debt', 'rewardPoint', 
                        'createdDate', 'modifiedDate'];
                        
  chainAction(urlApiOrders, params, titleHeaders, fileOrders);
}

function getCustomers(){
  const params = queryString.stringify({
    // pageSize : 10
  });
  const titleHeaders = ['id', 'code', 'name', 'gender', 'birthDate',
                        'contactNumber', 'address', 'retailerId', 'branchId',
                        'locationName', 'email', 'type', 'organization', 
                        'taxCode', 'comments', 'debt', 'rewardPoint', 
                        'createdDate', 'modifiedDate'];
                        
  chainAction(urlApiCustomers, params, titleHeaders, fileCustomers);
}

getCategories()
getProducts()
getOrders()
getCustomers()