const envData = {
    Prep: {
        requestUrl: 'https://agent.prdwk.com/loginAndRegisterSpecify',
        handler: prep
    },
    Prod: {
        requestUrl: 'https://agent.idnslot.info/loginAndRegisterSpecify',
        handler: prod
    },
    Playhard: {
        requestUrl: 'https://agent.idnslot.tech/loginAndRegisterSpecify',
        handler: playhard
    },
    Ifun7: {
        requestUrl: 'https://agent.idnslot.tech/loginAndRegisterSpecify',
        handler: ifun7
    },
};

const DEBUG = false;

// --- New functions for each environment --- 
function prep(responseData) {

    console.log("prep function called with:", responseData);

    if (!responseData || !responseData.data || !responseData.data.url) {
        console.error("Prep: No URL found in responseData to redirect.");
        return;
    }
    
        let originalUrl = responseData.data.url;
        console.log("Original URL:", originalUrl);

        const oldDomain = "https://dc6ed8aefj69r.cloudfront.net";
        const newDomain = "https://gc.prdwk.com";

        let modifiedUrl = originalUrl;

        // 1. Replace the main domain for the entire URL string first
        if (originalUrl.startsWith(oldDomain)) {
            modifiedUrl = originalUrl.replace(oldDomain, newDomain);
        }

        // 2. Modify the betrecordurl query parameter specifically
        // To do this robustly, we parse the URL, modify the param, then reconstruct
        try {
            const urlObject = new URL(modifiedUrl); // Use the already partially modified URL if domain replacement happened
            const params = urlObject.searchParams;
            
            const oldBetRecordUrlValue = `${oldDomain}/betrecord/`;
            const newBetRecordUrlValue = `${newDomain}/betrecord/`;

            if (params.has("betrecordurl")) {
                let currentBetRecordUrl = params.get("betrecordurl");
                if (currentBetRecordUrl.startsWith(oldDomain)) { // Check if it uses the old domain
                     currentBetRecordUrl = currentBetRecordUrl.replace(oldDomain, newDomain);
                     params.set("betrecordurl", currentBetRecordUrl);
                } else if (currentBetRecordUrl === oldBetRecordUrlValue) { // Or if it exactly matches the old full value
                     params.set("betrecordurl", newBetRecordUrlValue);
                }
            }
            
            urlObject.search = params.toString();
            modifiedUrl = urlObject.toString();

        } catch (e) {
            console.error("Error parsing or modifying URL parameters:", e);
            // Fallback or error handling if URL parsing fails, 
            // though basic domain replacement might have already occurred.
            // For now, we proceed with the `modifiedUrl` which might only have the domain replaced.
        }

        console.log("Redirecting to new URL for Prep (new tab):", modifiedUrl);
        window.open(modifiedUrl, '_blank'); // Open in a new tab

}

function prod(responseData) {
    console.log("prod function called with:", responseData);
    if (!responseData || !responseData.data || !responseData.data.url) {
        console.error("Prep: No URL found in responseData to redirect.");
        return;
    }

    let modifiedUrl = responseData.data.url;
    console.log("Redirecting to new URL for Prod (new tab):", modifiedUrl);
    window.open(modifiedUrl, '_blank');
}

function playhard(responseData) {
    console.log("playhard function called with:", responseData);
    // Add environment-specific logic for Playhard here
}

function ifun7(responseData) {
    console.log("ifun7 function called with:", responseData);
    // Add environment-specific logic for Ifun7 here
}
// --- End of new functions ---

async function postData(url, data) {
    console.log("Requesting URL:", url);
    console.log("Request data:", data);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // 嘗試在 response.ok 檢查前就解析 responseData，看看是否有更詳細的錯誤
        let responseData;
        try {
            responseData = await response.json();
            console.log("Raw response data:", responseData);
        } catch (e) {
            console.error("Failed to parse response JSON:", e);
            // 如果 JSON 解析失敗，嘗試讀取文本
            const textResponse = await response.text();
            console.error("Raw response text:", textResponse);
            throw new Error(`Failed to parse response JSON. Server responded with: ${response.status} ${response.statusText}. Response text: ${textResponse}`);
        }
        
        if (!response.ok) {
            console.error('HTTP error in postData:', response.status, response.statusText, responseData);
            const error = new Error(`HTTP error: ${response.status} ${response.statusText}`);
            error.status = response.status;
            error.data = responseData;
            throw error;
        }
        return responseData;
    } catch (error) {
        console.error('Detailed error in postData:', error); // 輸出更詳細的錯誤對象
        if (error.status) { // Re-throw structured HTTP errors
            throw error;
        }
        // For generic fetch errors (like network errors)
        throw new Error(`Network error or issue processing request: ${error.message}`);
    }
}

async function handleSubmit() {
    console.log("handleSubmit function called");
    const env = document.getElementById('environment').value;
    const account = document.getElementById('account').value;
    const game = document.getElementById('game').value;
    const lang = document.getElementById('lang').value;
    const token = document.getElementById('token').value;

    if ( !env || !account || !game || !lang || !token) { // Simplified check for empty values
        console.error('請填寫所有欄位');
        return false;
    }

    const selectedEnvData = envData[env];
    if (!selectedEnvData || !selectedEnvData.requestUrl) {
        console.error('無效的環境選項或找不到對應的 URL');
        return false;
    }
    // Check for handler existence as well
    if (typeof selectedEnvData.handler !== 'function') {
        console.error('未針對此環境定義處理函數。');
        console.warn('No handler function defined for environment:', env);
        return false;
    }

    const requestUrl = selectedEnvData.requestUrl;

    const requestBody = {
        account: account,
        game_id: parseInt(game, 10), // Assuming game_id should be an integer
        lang: lang,
        token: token
    };

    if ( DEBUG ) {
        responseData = {
            "error_code": 0,
            "message": "",
            "data": {
              "token": "MTc0Nzg4ODkwMzc2OTEzNjM4NAMbfbAnLhWYiznjbdcqKGuDoCLekqXDAdvXQRbw",
              "url": "https://dc6ed8aefj69r.cloudfront.net/45slot/index.html?gameid=4500&token=MTc0Nzg4ODkwMzc2OTEzNjM4NAMbfbAnLhWYiznjbdcqKGuDoCLekqXDAdvXQRbw&betrecordurl=https://dc6ed8aefj69r.cloudfront.net/betrecord/&lang=id&serverurl=https://gs.prdwk.com&t=20230323&chat=&homeurl=&mode=0&b=iqazwsxi",
              "account": "QA0522001",
              "credit": 30000000
            }
          };
        selectedEnvData.handler(responseData);
        return false;
    }

    try {
        // Call the new postData function
        const responseData = await postData(requestUrl, requestBody);

        console.log('Response from server:', responseData);
        console.error('請求成功! 請查看控制台以獲取響應內容。');
        // You can process responseData here, e.g., display it on the page

        // --- Call environment-specific function from envData ---
        selectedEnvData.handler(responseData);
        // --- End of environment-specific call ---

    } catch (error) {
        // Handle errors thrown from postData
        console.error('Error in handleSubmit:', error);
        if (error.data && error.data.message) {
             console.error(`請求失敗: ${error.status || ''} - ${error.data.message}`);
        } else if (error.message) {
            console.error(`請求時發生錯誤: ${error.message}`);
        } else {
            console.error('請求時發生未知錯誤。');
        }
        return false; // <--- 在 catch 區塊也加上 return false
    }

    return false; // Prevent default form submission
} 
