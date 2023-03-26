const loginPage = require("./../Pages/LoginPage.js");
const genericPopups = require("./../Pages/Generic.js");

const request = require("request");

module.exports = {

    createEmail: async function(callback) {

        request.post({
            headers: { "content-type" : "application/json" },
            method: "POST",
            url: "https://api.nodemailer.com/user",
            body: Buffer.from(
                JSON.stringify({
                    requestor: "nodemailer",
                    version: "6.7.8"
                })
            )
        }, (err, res, body) => {
            
            if(err)
                return callback("Failed to handle request!");
            
            const data = JSON.parse(body) || null;
            
            if(typeof(data) !== "object" || typeof(data.status) !== "string")
                return callback("Failed to resolve data");
            
            delete data.status;
            return callback(false, data);
    
        });

    },

    allowCookies: async function(page) {

        try {

            page.waitForSelector(genericPopups.onlyAllowEssentialCookies).then(() => {

                page.click(genericPopups.onlyAllowEssentialCookies);
                console.log("Accepted Cookies!");

            });

        } catch(e) { console.log("Failed to resole element!"); };

    },

    home: async function(page) {

        await page.goto("https://instagram.com");

    },

    login: async function(page, username, psw) {

        const cookies = await page.cookies();

        await page.setCookie(...cookies);
        await page.goto("https://instagram.com");

        try {

            //const el = ".aOOlW.HoLwm";
            //await page.waitForSelector(el);
            //await page.click(el);

            //await page.waitForTimeout(1000);

        } catch(e) { return console.log("Failed to find element to accept cookies!")};

        try {

            for([ el, val ] of Object.entries(loginPage))
                await page.waitForSelector(val);

            await page.click(loginPage.usernameEntry);
            
            console.log(`Specifying Username: ${username}`);
            await page.keyboard.type(username);

            
            
            await page.click(loginPage.pswEntry);
            
            console.log(`Specifying Password: ${psw}`);
            await page.keyboard.type(psw);

            console.log(`Submitting Credentials...`);
            
            await page.waitForTimeout(1000);
            await page.click(loginPage.submitBtn);

            await page.waitForNavigation();

        } catch(e) { return console.log("Failed to authorize instance!"); };

    },

    followUser: async function(page, user) {

        await page.goto(`https://instagram.com/${user}`);
        //await this.allowCookies(page);

        const items = {
            
            "profileIcon": "._aa_h",
            "followBtn": "._acan._acap._acas"

        };
        
        let el = (await page.$(items.profileIcon) || null);
        
        if(el == null)
            return console.log("Failed to resolve username!");
        
        el = (await page.$(items.followBtn) || null);
        
        if(el == null)
            return console.log("Failed to resolve follow button!");
        
        return el.click();

    }

};