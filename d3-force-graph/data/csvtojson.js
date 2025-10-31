import csv from "csvtojson";
import fs from "fs";

csv()
  .fromFile("tiiqu_data.csv")
  .then((jsonObj) => {
    fs.writeFileSync("qna_enriched.json", JSON.stringify(jsonObj, null, 2));
    console.log("✅ Converted CSV → data.json");
  });
