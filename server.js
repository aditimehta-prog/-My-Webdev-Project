
let express = require("express");
let mysql = require("mysql2");
let cloudinary = require("cloudinary").v2;
require("dotenv").config();

let app = express();


// Start server
app.listen(2002, function () {
    console.log("Server started at http://localhost:2002");
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
let fileuploader = require("express-fileupload");
app.use(fileuploader());
// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Aiven MySQL connection
let mysqlCon = mysql.createConnection(process.env.AIVEN_URL);

mysqlCon.connect(function (err) {
    if (err) {
        console.error("MySQL connection error:", err.message);
    } else {
        console.log("Aiven MySQL Connected Successfully!");
    }
});

// Home page

app.get("/Home-page", function (req, resp) {
    resp.sendFile(__dirname + "/public/index.html");
});

app.get("/NGOregistration", function (req, resp) {
    resp.sendFile(__dirname + "/public/NGO-registration.html");
});
app.get("/donorregistration", function (req, resp) {
    resp.sendFile(__dirname + "/public/donor-registration.html");
});
app.get("/availEquipment", function (req, resp) {
    resp.sendFile(__dirname + "/public/avail-equipment.html");
});
app.get("/availMedicines", function (req, resp) {
    resp.sendFile(__dirname + "/public/avail-medicine.html");
});
app.get("/genai", function (reqObj, respObj) {
    let path = __dirname + "/public/gen-ai.html";
    respObj.sendFile(path);
});
app.get("/needyregistration", function (reqObj, respObj) {
    let path = __dirname + "/public/needy-registration.html";
    respObj.sendFile(path);
});
app.get("/usermaster", function (reqObj, respObj) {
    let path = __dirname + "/public/user-master.html";
    respObj.sendFile(path);
});
app.get("/NGOcontrolpanel", function (reqObj, respObj) {
    let path = __dirname + "/public/NGOs-control-panel.html";
    respObj.sendFile(path);
});
app.get("/Donorcontrolpanel", function (reqObj, respObj) {
    let path = __dirname + "/public/donor-control-manager.html";
    respObj.sendFile(path);
});
app.get("/Medicinepanel", function (reqObj, respObj) {
    let path = __dirname + "/public/medicine-manager.html";
    respObj.sendFile(path);
});
app.get("/Equipmentpanel", function (reqObj, respObj) {
    let path = __dirname + "/public/equipment-manager.html";
    respObj.sendFile(path);
});
app.get("/donordashboard", function (reqObj, respObj) {
    let path = __dirname + "/public/donor-dashboard.html";
    respObj.sendFile(path);
});
app.get("/needydashboard", function (reqObj, respObj) {
    let path = __dirname + "/public/needy-dashboard.html";
    respObj.sendFile(path);
});
app.get("/ngodashboard", function (reqObj, respObj) {
    let path = __dirname + "/public/NGO-dashboard.html";
    respObj.sendFile(path);
});
app.get("/admindashboard", function (reqObj, respObj) {
    let path = __dirname + "/public/admin-dashboard.html";
    respObj.sendFile(path);
});
app.get("/searchequipment", function (reqObj, respObj) {
    let path = __dirname + "/public/search-equipment.html";
    respObj.sendFile(path);
});

// ================= SIGNUP =================

app.post("/do-signup", function (req, resp) {
    let emailid = req.body.txtEmail;
    let pwd = req.body.txtPwd;
    let utype = req.body.comboUser;
    mysqlCon.query("INSERT INTO users VALUES (?, ?, ?, ?)", [emailid, pwd, utype, 1], function (err, result) {
        if (err == null) {
            resp.send("record saved successfully");
        }
        else {
            resp.send(err.message);
        }
    });
});
// ================= LOGIN =================

app.post("/do-login", function (req, resp) {
    let emailid = req.body.email;
    let pwd = req.body.pwd;
    mysqlCon.query("SELECT * FROM users WHERE emailid = ? and pwd =? and status = 1", [emailid, pwd], function (err, result) {
        if (err == null) {
            console.log(result);
            if (result.length == 1) {
               return resp.send(result[0].utype); 
            }
            else
                resp.send("Invalid email id password");
        }
        else
            resp.send(err.message);
    });
});

/* FETCH NGO RECORD */
app.post("/fetchNgoRecord", (req, resp) => {
    let emailid = req.body.emailidAjax;

    console.log("Email received:", emailid);

    mysqlCon.query(
        "SELECT * FROM ngos WHERE emailid = ?",
        [emailid],
        function (err, table) {
            if (err) {
                return resp.status(500).send(err.message);
            }

            if (table.length === 1) {
                resp.send(table[0]);
            } else {
                resp.send("Invalid Id");
            }
        }
    );
});


/* UPDATE NGO RECORD */
app.post("/updateNgoRecord", async function (req, resp) {

    let myUrl = req.body.hdn || "nopic.jpg";
    let aadharUrl = req.body.hdnAadhar || "nopic.jpg";

    // Registration Proof Picture
    if (req.files && req.files.proofPic) {
        let filename = req.files.proofPic.name;
        let fullPath = __dirname + "/uploads/" + filename;

        await req.files.proofPic.mv(fullPath);

        let uploaded = await cloudinary.uploader.upload(fullPath);
        myUrl = uploaded.secure_url;
    }

    // President Aadhaar Picture
    if (req.files && req.files.presidentAadharPic) {
        let filename = req.files.presidentAadharPic.name;
        let fullPath = __dirname + "/uploads/" + filename;

        await req.files.presidentAadharPic.mv(fullPath);

        let uploaded = await cloudinary.uploader.upload(fullPath);
        aadharUrl = uploaded.secure_url;
    }

    let emailid = req.body.txtemailid;
    let ngoname = req.body.txtngoname;
    let regno = req.body.txtRegno;
    let type = req.body.comboType;
    let address = req.body.txtAddress;
    let city = req.body.txtCity;
    let president = req.body.txtPresident;
    let contact = req.body.txtContact;
    let website = req.body.txtWebsite;

    mysqlCon.query(
        `UPDATE ngos
             SET ngoname = ?, regno = ?, type = ?, address = ?,
                 city = ?, president = ?, contact = ?, picurl = ?,
                 presidentAadharPic = ?, website = ?
             WHERE emailid = ?`,
        [
            ngoname, regno, type, address, city, president,
            contact, myUrl, aadharUrl, website, emailid
        ],
        function (err, result) {
            if (err) {
                return resp.status(500).send(err.message);
            }

            if (result.affectedRows > 0) {
                resp.send("Record Updated Successfully");
            } else {
                resp.send("Invalid Id or No Changes Made");
            }
        }
    );
});


/* SAVE NGO RECORD */
app.post("/saveNgoRecord", async function (req, resp) {

    console.log(req.body);

    let myUrl = "nopic.jpg";
    let aadharUrl = "nopic.jpg";

    // Registration Proof Picture
    if (req.files && req.files.proofPic) {
        let filename = req.files.proofPic.name;
        let fullPath = __dirname + "/uploads/" + filename;

        await req.files.proofPic.mv(fullPath);

        let uploaded = await cloudinary.uploader.upload(fullPath);
        myUrl = uploaded.secure_url;
    }

    // President Aadhaar Picture
    if (req.files && req.files.presidentAadharPic) {
        let filename = req.files.presidentAadharPic.name;
        let fullPath = __dirname + "/uploads/" + filename;

        await req.files.presidentAadharPic.mv(fullPath);

        let uploaded = await cloudinary.uploader.upload(fullPath);
        aadharUrl = uploaded.secure_url;
    }

    let emailid = req.body.txtemailid;
    let ngoname = req.body.txtngoname;
    let regno = req.body.txtRegno;
    let type = req.body.comboType;
    let address = req.body.txtAddress;
    let city = req.body.txtCity;
    let president = req.body.txtPresident;
    let contact = req.body.txtContact;
    let website = req.body.txtWebsite;

    mysqlCon.query(
        `INSERT INTO ngos
             (emailid, ngoname, regno, type, address, city, president,
              contact, picurl, presidentAadharPic, website)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            emailid, ngoname, regno, type, address, city,
            president, contact, myUrl, aadharUrl, website
        ],
        function (err, result) {
            if (err) {
                return resp.status(500).send(err.message);
            }

            resp.send("Record Saved Successfully");
        }
    );

});

// Save Donar Record
app.post("/SaveDonarRecord", async function (req, resp) {
    let emailid = req.body.emailid;
    let name = req.body.name;
    let adhaar = req.body.adhaar;
    let pin = req.body.pin;
    let address = req.body.address;
    let region = req.body.region;
    let district = req.body.district;
    let contact = req.body.contact;
    let hfrom = req.body.hfrom;
    let hto = req.body.hto;
    mysqlCon.query("INSERT INTO donors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [emailid, name, address, adhaar, pin, region, district, contact, hfrom, hto],
        function (err, result) {
            if (err == null)
                resp.send("Record Saved Successfullyy");
            else
                resp.send(err.message);
        });
})
// Update Donar Record
app.post("/UpdateDonarRecord", async function (req, resp) {
    let emailid = req.body.emailid;
    let name = req.body.name;
    let adhaar = req.body.adhaar;
    let pin = req.body.pin;
    let address = req.body.address;
    let region = req.body.region;
    let district = req.body.district;
    let contact = req.body.contact;
    let hfrom = req.body.hfrom;
    let hto = req.body.hto;
    mysqlCon.query("UPDATE ngos SET name = ?, address = ?, adhaar = ?, pin = ?,region = ?, district = ?, contact = ?, hfrom= ?, hto = ? WHERE emailid = ?",
        [name, address, adhaar, pin, region, district, contact, hfrom, hto, emailid], function (err, result) {
            if (err) {
                return resp.send(err.message);
            }

            if (result.affectedRows > 0) {
                resp.send("Record Updated Successfully");
            } else {
                resp.send("Invalid Id or No Changes Made");
            }
        });
})
// Fetch Donar Record
app.post("/FetchDonarRecord", (req, resp) => {
    let emailid = req.body.emailidAjax;
    console.log("Email received:", emailid);

    mysqlCon.query("SELECT * FROM ngos WHERE emailid = ?", [emailid], function (err, table) {
        if (err == null) {
            console.log(table)
            if (table.length == 1)
                resp.send(table[0]);
            else
                resp.send("Invalid Id");
        }
        else
            resp.send(err.message);
    });
});

// Medicine Availability
app.post("/saveAvailMed", async function (req, resp) {
    console.log(req.body);
    let myUrl = "nopic.jpg";
    // Upload Medicine Picture
    if (req.files && req.files.picurl) {
        let filename = req.files.picurl.name;
        let fullPath = __dirname + "/uploads/" + filename;
        await req.files.picurl.mv(fullPath);
        // Upload image to Cloudinary
        let picUrlResult = await cloudinary.uploader.upload(fullPath);
        myUrl = picUrlResult.secure_url;
        console.log("Picture Uploaded Successfully: " + myUrl);
    }
    else {
        console.log("No picture uploaded");
    }
    // Get form data
    let emailid = req.body.emailid;
    let medicine = req.body.medecine;
    let power = req.body.power;
    let company = req.body.company;
    let qty = req.body.qty;
    let packing = req.body.packing;
    let doexp = req.body.doexp;

    // Save record in MySQL
    mysqlCon.query("INSERT INTO medecines VALUES (null,?, ?, ?, ?, ?, ?, ?, ?)", [emailid, medicine, power, company, qty, packing, doexp, myUrl],
        function (err, result) {
            if (err == null)
                resp.send("Record Saved Successfullyy");
            else
                resp.send(err.message);
        });
});
// Equipment Avail
app.post("/saveAvailEqu", async function (req, resp) {
    console.log(req.body);
    let myUrl = "nopic.jpg";
    // Upload Medicine Picture
    if (req.files && req.files.picurl) {
        let filename = req.files.picurl.name;
        let fullPath = __dirname + "/uploads/" + filename;
        await req.files.picurl.mv(fullPath);
        // Upload image to Cloudinary
        let picUrlResult = await cloudinary.uploader.upload(fullPath);
        myUrl = picUrlResult.secure_url;
        console.log("Picture Uploaded Successfully: " + myUrl);
    }
    else {
        console.log("No picture uploaded");
    }
    // Get form data
    let emailid = req.body.emailid;
    let category = req.body.category;

    // Save record in MySQL
    mysqlCon.query("INSERT INTO equipments  VALUES (null,?, ?, ?)", [emailid, category, myUrl],
        function (err, result) {
            if (err == null)
                resp.send("Record Saved Successfullyy");
            else
                resp.send(err.message);
        });
});

//================GEN AI==================

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);//add your own API key
console.log(genAI)


const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

async function generativeaiuse(imgurl) {
    const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string."
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);
    console.log(result.response.text())

    const cleaned = result.response.text().replace(/```json|```/g, '').trim();
    const jsonData = JSON.parse(cleaned);
    console.log(jsonData);

    return jsonData

}

app.post("/ai-read-pic", async function (req, resp) {
    let jsonResultFromAi;
    let msg = "File not Uploaded";
    let myUrl = "nopic.jpg";
    if (req.files != null) {
        let fileName = req.files.apic.name;
        let fullPath = __dirname + "/uploads/" + fileName;
        await req.files.apic.mv(fullPath);
        msg = "Uploaded Successfully";

        await cloudinary.uploader.upload(fullPath).then(async function (picUrlResult) {
            myUrl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myUrl);
            jsonResultFromAi = await generativeaiuse(myUrl);
            console.log(jsonResultFromAi);
            resp.send(jsonResultFromAi);

        });

    }
})

// needy registration


function parseAIJson(text) {
    let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    console.log("Gemini response:", cleaned);

    return JSON.parse(cleaned);
}

// ================ FRONT PIC PROMPT ================

async function readFrontAadhaar(file) {

    const frontPrompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string.";
    const result = await model.generateContent([
        {
            inlineData: {
                data: file.data.toString("base64"),
                mimeType: file.mimetype
            }
        },
        frontPrompt
    ]);

    return parseAIJson(result.response.text());
}


// ================ REAR PIC PROMPT ================

async function readRearAadhaar(file) {

    const rearPrompt = `Read the REAR SIDE of this Aadhaar card. Extract ONLY the postal address printed on the card. Return ONLY valid JSON in this exact format: {"address": ""}`;
    const result = await model.generateContent([
        {
            inlineData: {
                data: file.data.toString("base64"),
                mimeType: file.mimetype
            }
        },
        rearPrompt
    ]);
    return parseAIJson(result.response.text());
}

app.post("/aiready-pic", async function (req, resp) {

    if (!req.files || !req.files.frontPic || !req.files.rearPic) {
        return resp.send("Please upload both front and rear Aadhaar pictures");
    }

    const frontPic = req.files.frontPic;
    const rearPic = req.files.rearPic;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (
        !allowedTypes.includes(frontPic.mimetype) ||
        !allowedTypes.includes(rearPic.mimetype)
    ) {
        return resp.send("Please upload valid images");
    }

    const emailid = (req.body.emailid || "").trim();
    const contact = (req.body.contact || "").trim();

    if (!emailid || !contact) {
        return resp.send("Email and contact are required");
    }

    try {
        // Read front and rear pictures
        const [frontData, rearData] = await Promise.all([
            readFrontAadhaar(frontPic),
            readRearAadhaar(rearPic)
        ]);

        // Extract details
        const name = frontData.name || "";
        const gender = frontData.gender || "";
        const dob = frontData.dob || "";
        const aadhaar_number = frontData.adhaar_number || "";
        const address = rearData.address || "";

        // Save details in MySQL
        await mysqlCon.promise().execute(
            `INSERT INTO needys
            (emailid, contact, name, gender, dob, address, aadhaar)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                emailid,
                contact,
                name,
                gender,
                dob,
                address,
                aadhaar_number
            ]
        );

        resp.send({
            success: true,
            message: "Aadhaar details saved successfully",
            data: {
                emailid,
                contact,
                name,
                gender,
                dob,
                aadhaar_number,
                address
            }
        });

    } catch (err) {
        console.log("Aadhaar processing error:", err.message);
        resp.send("Error: " + err.message);
    }
})

// ================ NEEDY REGISTRATION ================

// Parse Gemini JSON response
function parseAIJson(text) {
    let cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    console.log("Gemini response received");

    return JSON.parse(cleaned);
}


// ================ READ FRONT AADHAAR ================

async function readFrontAadhaar(file) {

    const frontPrompt = `
    Read the front side of the Aadhaar card.
    Extract the name, gender, date of birth and Aadhaar number.
    Return ONLY valid JSON in this format:
    {
        "adhaar_number": "",
        "name": "",
        "gender": "",
        "dob": ""
    }
    Do not guess any missing information.
    `;

    const result = await model.generateContent([
        {
            inlineData: {
                data: file.data.toString("base64"),
                mimeType: file.mimetype
            }
        },
        frontPrompt
    ]);

    return parseAIJson(result.response.text());
}


// ================ READ REAR AADHAAR ================

async function readRearAadhaar(file) {

    const rearPrompt = `
    Read the rear side of the Aadhaar card.
    Extract ONLY the postal address printed on the card.
    Do not guess missing information.
    Return ONLY valid JSON in this format:
    {
        "address": ""
    }
    `;

    const result = await model.generateContent([
        {
            inlineData: {
                data: file.data.toString("base64"),
                mimeType: file.mimetype
            }
        },
        rearPrompt
    ]);

    return parseAIJson(result.response.text());
}


// ================ SAVE NEEDY RECORD ================

app.post("/aiready-pic", async function (req, resp) {

    // Check both uploaded pictures
    if (!req.files || !req.files.frontPic || !req.files.rearPic) {
        return resp.send("Please upload both front and rear Aadhaar pictures");
    }

    const frontPic = req.files.frontPic;
    const rearPic = req.files.rearPic;

    // Check image types
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        !allowedTypes.includes(frontPic.mimetype) ||
        !allowedTypes.includes(rearPic.mimetype)
    ) {
        return resp.send("Please upload JPG, PNG or WEBP images");
    }

    // Get email and contact from form
    const emailid = (req.body.emailid || "").trim();
    const contact = (req.body.contact || "").trim();

    if (!emailid || !contact) {
        return resp.send("Email and contact are required");
    }

    try {

        // Read both images using Gemini AI
        const [frontData, rearData] = await Promise.all([
            readFrontAadhaar(frontPic),
            readRearAadhaar(rearPic)
        ]);

        // Extract details
        const name = frontData.name || "";
        const gender = frontData.gender || "";
        const dob = frontData.dob || "";

        // Remove spaces from Aadhaar number
        const aadhaar_number = (frontData.adhaar_number || "")
            .replace(/\s/g, "");

        const address = rearData.address || "";

        // Basic extracted-data checks
        if (!name || !aadhaar_number) {
            return resp.send(
                "Could not read the required details. Please upload clear images."
            );
        }

        if (!/^\d{12}$/.test(aadhaar_number)) {
            return resp.send(
                "Aadhaar number could not be read correctly. Please check the image."
            );
        }

        // Save record in MySQL
        await mysqlCon.promise().execute(`INSERT INTO needys (emailid, contact, name, gender, dob, address, aadhaar)VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [emailid, contact, name, gender, dob, address, aadhaar_number]
        );

        // Send success response
        return resp.send({
            success: true,
            message: "Needy record saved successfully"
        });

    } catch (err) {
        console.log("Aadhaar processing error:", err.message);
        return resp.send("Error: " + err.message);
    }
});
app.post("/doShowAll",function(req,resp)
{   
    mysqlCon.query("Select * from users",function(err,result){
        if(err==null)
        {
            resp.send(result);
        }
        else
            resp.send(err.message);

    })
})
app.get("/doDelete",function(req,resp)
{
    mysqlCon.query("delete from users where emailid=?",[req.query.txtEmail],function(err,result){
            if(err==null)
                    {
                        if(result.affectedRows==1)
                            resp.send("Deleted Successfullyy");
                        else
                             resp.send("Invalid Email id");   
                    }
            else
                resp.send(err.message);
    })
})
app.get("/doBlock", function(req, resp)
{
    mysqlCon.query("UPDATE users SET status=0 WHERE emailid=?",[req.query.txtEmail],function(err, result)
        {
            if(err == null)
            {
                if(result.affectedRows == 1)
                    resp.send("User Blocked Successfully");
                else
                    resp.send("Invalid Email id");
            }
            else
                resp.send(err.message);
        }
    );
});
app.get("/doResume", function(req, resp)
{
    mysqlCon.query("UPDATE users SET status=1 WHERE emailid=?",[req.query.txtEmail],function(err, result)
        {
            if(err == null)
            {
                if(result.affectedRows == 1)
                    resp.send("User Resumed Successfully");
                else
                    resp.send("Invalid Email id");
            }
            else
                resp.send(err.message);
        }
    );
});
app.post("/fetchallNGOs",function(req,resp)
{   
    mysqlCon.query("Select * from ngos",function(err,result){
        if(err==null)
        {
            resp.send(result);
        }
        else
            resp.send(err.message);

    })
})

app.post("/fetchalldonars",function(req,resp)
{   
    mysqlCon.query("Select * from donors",function(err,result){
        if(err==null)
        {
            resp.send(result);
        }
        else
            resp.send(err.message);

    })
})
app.post("/doshowAllMedicine",function(req,resp)
{   
    let emailid = req.query.emailid;
    mysqlCon.query("Select * from medecines where emailid=?",[emailid],function(err,result){
        if(err==null)
        {
            resp.send(result);
        }
        else
            resp.send(err.message);

    })
})
app.get("/doDeleteMedicine", function (req, resp) {
    let rid = req.query.rid;
    mysql.query("DELETE FROM medecines WHERE rid = ?",[rid],function (err, result) {
            if (err)
                resp.send(err);
            else
                resp.send("Record Deleted Successfully");
        }
    );
});
app.get("/doDeleteEquipment", function (req, resp) {
    let rid = req.query.rid;
    mysql.query("DELETE FROM equipments WHERE rid = ?",[rid],function (err, result) {
            if (err)
                resp.send(err);
            else
                resp.send("Record Deleted Successfully");
        }
    );
});
app.post("/doshowAllEquipment",function(req,resp)
{   
    let emailid = req.query.emailid;
    mysqlCon.query("Select * from equipments where emailid =?",[emailid],function(err,result){
        if(err==null)
        {
            resp.send(result);
        }
        else
            resp.send(err.message);

    })
})

 app.get("/loadDistCities",(req,resp)=>{

     mysqlCon.query("select distinct district from donors",function(err,table)
    {
            if(err==null)
               {
                        resp.send(table);    
                }
            else
                resp.send(err.message);
    })
})
 app.get("/fillCategories",(req,resp)=>{

     mysqlCon.query("select distinct category from equipments",function(err,table)
    {
            if(err==null)
               {
                        resp.send(table);    
                }
            else
                resp.send(err.message);
    })
})
 app.get("/findEquipments",(req,resp)=>{
    let city = req.query.city;
    let category = req.query.category;
    mysqlCon.query("select donors.emailid ,equipments.category,equipments.picUrl FROM donors INNER JOIN equipments ON donors.emailid = equipments.emailid WHERE donors.district = ? AND equipments.category = ?",[city,category],function(err,table)
    {
            if(err==null)
            {
                resp.send(table);    
            }
            else
                resp.send(err.message);
    })
})
app.get("/doshowDonor",function(req,resp)
{   
    let emailid = req.query.emailid;
    mysqlCon.query("Select * from donors where emailid = ?",[emailid],function(err,result){
        if(err==null)
        {
            resp.send(result);
        }
        else
            resp.send(err.message);

    })
})
app.post("/admin-login", function(req, resp)
{
    console.log("Entered Passcode:", req.body.passcode);
    let passcode = req.body.passcode;
    if(passcode == "123456")
    {
        resp.send("success");
    }
    else
    {
        resp.send("wrong");
    }
})
