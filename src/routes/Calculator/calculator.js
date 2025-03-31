import puppeteer from "puppeteer";
import { Router } from "express";

const calculatorRouter = Router();

calculatorRouter.get("/calculator/amazon-weight", async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Se requiere una URL de Amazon." });
    }

    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

        const weight = await page.evaluate(() => {
            let weightText = "Peso no encontrado";
            let debugInfo = [];

            // Función para buscar en tablas de especificaciones
            const searchWeight = (selector) => {
                const table = document.querySelector(selector);
                if (table) {
                    const rows = table.querySelectorAll("tr");
                    for (let row of rows) {
                        const th = row.querySelector("th");
                        const td = row.querySelector("td");

                        if (th && td) {
                            const thText = th.innerText.trim().toLowerCase();
                            const tdText = td.innerText.trim();
                            debugInfo.push(`${thText}: ${tdText}`);

                            if (thText.includes("item weight") || thText.includes("peso del producto")) {
                                return tdText;
                            }
                        }
                    }
                }
                return null;
            };

            // 🔍 Buscar en diferentes secciones de la página
            weightText = searchWeight("#productDetails_detailBullets_sections1") ||
                         searchWeight("#productDetails_techSpec_section_1");

            // 📌 Alternativa: Buscar en listas de detalles
            if (!weightText || weightText === "Peso no encontrado") {
                const listItems = document.querySelectorAll(".a-unordered-list.a-nostyle.a-vertical.a-spacing-none.detail-bullet-list li");
                for (let item of listItems) {
                    const text = item.innerText.trim().toLowerCase();
                    debugInfo.push(text);

                    if (text.includes("item weight") || text.includes("peso del producto")) {
                        weightText = item.innerText.replace(/.*?:/, "").trim();
                        break;
                    }
                }
            }

            // 📋 Última opción: Buscar en la descripción larga
            if (!weightText || weightText === "Peso no encontrado") {
                const productDescription = document.querySelector("#productDescription")?.innerText || "";
                debugInfo.push("Descripción del producto encontrada.");

                const match = productDescription.match(/(peso|weight|pounds).*?(\d+(\.\d+)?\s?(kg|g|lb|lbs))/i);
                if (match) {
                    weightText = match[2];
                }
            }

            return { weight: weightText, debugInfo };
        });

        console.log("Debug Info:", weight.debugInfo);
        console.log("Peso encontrado:", weight.weight);

        await browser.close();

        return res.status(200).json({ weight: weight.weight });
    } catch (error) {
        console.error("Error al obtener el peso:", error);
        return res.status(500).json({ error: "Error al extraer el peso del producto." });
    }
});

export default calculatorRouter;
