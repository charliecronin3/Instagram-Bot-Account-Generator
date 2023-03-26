const { faker } = require("@faker-js/faker");
const puppeteer = require("puppeteer");
const request = require("request");
const express = require("express");
const app = express();

const Utils = require("./PageUtils/PageUtils.js");
var cookies = null;

const { v4 } = require("uuid");

const enmap = require("enmap");
var users = new enmap( { name: "Bots " });

const { simpleParser } = require("mailparser");
const Imap = require("imap");

(async () => {

    await Utils.createEmail(async (err, account) => {

        if(err)
            return console.log(err);
        
        const imap = new Imap({
            user: account.user,
            password: account.pass,
            host: account.imap.host,
            port: account.imap.port,
            tls: true
        });

        imap.once("ready", async () => {

            await imap.openBox("INBOX", true, async (err, box) => {
                
                console.log(box);

                const id = v4();
                const email = account.user;
                const fullname = faker.name.fullName();
                const username = String(fullname.split(" ").join("") + Math.floor(100000 + Math.random() * 900000));

                const user = {
                    "id": id,
                    "email": email,
                    "pass": account.pass,
                    "username": username,
                    "avatar": faker.internet.avatar()
                };

                const browser = await puppeteer.launch({headless: false});
                const page = await browser.newPage();

                await page.setViewport({ width: 700, height: 700});
                await page.goto("https://www.instagram.com/accounts/emailsignup");

                await page.waitForTimeout(3000);
                
                const errorEl = (await page.$(".p-error.dialog-404") || null);
                if(errorEl)
                    return console.log("Instagram has displayed an error!");
                
                /* Agree to Cookies */
                
                const el = (await page.$("._a9--._a9_1") || null);
                if(el !== null) {

                    await el.click();
                    await page.waitForTimeout(1000); /* Wait for agreement popup to disapepar */

                } else {

                    console.log("Cookies agreement was not requested?");

                }
                
                /* Search for inputs */

                try {

                    await page.waitForSelector("._aa48");

                } catch(e) { return console.log("Failed to resolve inputs?"); };
                
                const inputs = await page.$$("._aa48");
                
                if(inputs.length < 4)
                    return console.log("Failed to resolve all inputs!");
                
                const handleInput = async function (el, I) {

                    switch(I) {

                        case 0: /* Email Or Phone */

                            await el.click();
                            await page.keyboard.type(email);
                            await page.waitForTimeout(1000);

                        break;

                        case 1: /* Full Name */
                            
                            await el.click();
                            await page.keyboard.type(fullname);
                            await page.waitForTimeout(1000);

                        break;

                        case 2: /* Username */
                            
                        await el.click();
                        await page.keyboard.type(username);
                        await page.waitForTimeout(1000);

                        break;

                        case 3: /* Password */
                            
                        await el.click();
                        await page.keyboard.type(account.pass);
                        await page.waitForTimeout(1000);

                        await page.keyboard.press("Enter");

                    };

                };
                
                const handleInputs = async function() {

                    return new Promise(async (res, rej) => {

                        await page.waitForTimeout(1000);

                        await inputs.forEach(async (input, I) => {
            
                            await setTimeout(async () => {
                                
                                await handleInput(input, I);
                
                                if(I == (inputs.length - 1))
                                    res();
                                
                            }, I * 500);
                
                        });
            
                    });

                };

                await handleInputs();
                await page.waitForSelector("._aau-");

                const dropdowns = await (page.$$("._aau-") || null);

                if(dropdowns.length < 2)
                    return console.log("Failed to resolve all dob dropdowns!");
                
                const handleDOBDropdowns = async function () {
                    
                    return new Promise(async (res, rej) => {

                        const dob = faker.date.birthdate();
                        const month = new Intl.DateTimeFormat("en-US", { month: "long"}).format(dob);
                        const day = (Math.floor(Math.random() * 25) || 1);

                        const handleDropdown = async (el, I) => {

                            switch(I) {

                                case 0: /* Month */

                                    await el.select(month);
                                    await page.waitForTimeout(1000);
                                
                                break;

                                case 1: /* Day */

                                    await el.select(String(day));
                                    await page.waitForTimeout(1000);
                                
                                break;

                                case 2: /* Year */

                                    await el.select("2000");
                                    await page.waitForTimeout(1000);

                                    res();
                                
                                break;
                            };

                        };

                        dropdowns.forEach(async (el, I) => {

                            setTimeout(async () => {

                                await handleDropdown(el, I);

                            }, I * 1000);

                        });

                    });

                };

                await handleDOBDropdowns();
                await page.waitForSelector("._acan._acap._acaq._acas._aj1-");
                
                const btns = (await page.$$("._acan._acap._acaq._acas._aj1-") || null);

                if(btns.length <= 0)
                    return console.log("Failed to resolve date of birth confirmation!");
                
                btns[0].click();
                await page.waitForTimeout(1000);

                await page.waitForSelector("._aaie._aaic._ag7n");
                
                const input = (await page.$("._aaie._aaic._ag7n") || null);
                const confirmBtn = (await page.$("._acan._acap._acaq._acas._aj1-") || null);
                
                if(input == null)
                    return console.log("Failed to resolve email confirmation code input!");
                
                await input.click();
                await page.waitForTimeout(1000);

                imap.on("mail", async (numNewMsgs) => {

                    imap.search(["UNSEEN"], async (err, results) => {

                        const f = imap.fetch(results, {bodies: ""});

                        f.on("message", async (msg) => {

                            msg.on("body", async (stream) => {

                                simpleParser(stream, async (err, parsed) => {

                                    await input.click();
                                    await page.keyboard.type(String(parsed.subject.split(" ")[0]));
                                    await page.waitForTimeout(5000);

                                    await confirmBtn.click();

                                    try {

                                        //

                                    } catch(e) {};

                                });

                            });

                        });

                    });
        
                });

            });

        });

        imap.once("error", async (err) => {

            console.log(err);

        });

        if(imap.state != "authenticated")
            imap.connect();

    });

})();