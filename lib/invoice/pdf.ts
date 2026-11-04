import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { InvoiceSnapshot } from "./links";

const W = 595.28, H = 841.89;
const ink = rgb(.149,.204,.227), muted = rgb(.41,.46,.46);
const paper = rgb(.985,.979,.965);
const pale = rgb(.955,.938,.917), line = rgb(.85,.87,.85), white = rgb(1,1,1);

function amount(value: number) { return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function orderDate(value: string) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (!match) return value;
  const month = Number(match[1]), day = Number(match[2]);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? `${String(day).padStart(2,"0")} ${months[month-1]} ${match[3]}` : value;
}
function draw(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = ink) {
  page.drawText(text, { x, y, font, size, color });
}
function right(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = ink) {
  draw(page, text, x - font.widthOfTextAtSize(text, size), y, font, size, color);
}
function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [], addWord = (word: string) => {
    const current = lines.pop() || "";
    if (current && font.widthOfTextAtSize(`${current} ${word}`, size) <= maxWidth) { lines.push(`${current} ${word}`); return; }
    if (current) lines.push(current);
    while (font.widthOfTextAtSize(word, size) > maxWidth) {
      let length = 1;
      while (length < word.length && font.widthOfTextAtSize(word.slice(0,length+1), size) <= maxWidth) length++;
      lines.push(word.slice(0,length)); word = word.slice(length);
    }
    lines.push(word);
  };
  for (const word of words) addWord(word);
  return lines;
}

export async function makeCustomerInvoicePdf(snapshot: InvoiceSnapshot): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`PurelyJid ${snapshot.mode === "invoice" ? "Order Invoice" : "Advance Receipt"} ${snapshot.orderId}`);
  pdf.setAuthor("PurelyJid");
  const fonts = path.join(process.cwd(), "lib", "invoice", "fonts");
  const [regularBytes,boldBytes] = await Promise.all([
    readFile(path.join(fonts,"DejaVuSans.ttf")),readFile(path.join(fonts,"DejaVuSans-Bold.ttf")),
  ]);
  const regular = await pdf.embedFont(regularBytes,{ subset:true });
  const bold = await pdf.embedFont(boldBytes,{ subset:true });
  const page = pdf.addPage([W,H]);
  page.drawRectangle({x:0,y:0,width:W,height:H,color:paper});
  page.drawRectangle({x:0,y:H-11,width:W,height:11,color:ink});
  draw(page,"PurelyJid",47,770,bold,27);
  draw(page,"Near Sudarshan Chowk, Beside New Rohit Electronics,",47,748,regular,9,muted);
  draw(page,"Near 8-80 Garden, Pimple Gurav, Pune 411027",47,733,regular,9,muted);
  const decided = snapshot.mode === "invoice";
  draw(page,decided ? "ORDER INVOICE" : "ADVANCE RECEIPT",47,681,bold,21);
  draw(page,decided ? "Your order and payment summary" : "Payment received for your pending selection",47,660,regular,9,muted);
  page.drawLine({start:{x:47,y:642},end:{x:W-47,y:642},color:line,thickness:1});
  draw(page,"ORDER NO.",47,617,regular,8,muted);
  draw(page,snapshot.orderId,47,599,bold,11);
  draw(page,"ORDER DATE",241,617,regular,8,muted);
  draw(page,orderDate(snapshot.orderDate),241,599,bold,11);
  draw(page,"FULFILMENT",424,617,regular,8,muted);
  draw(page,snapshot.fulfillmentMethod,424,599,bold,11);
  page.drawRectangle({x:47,y:521,width:W-94,height:53,color:pale});
  draw(page,"PREPARED FOR",64,556,regular,8,muted);
  const nameLines=wrap(snapshot.customerName,bold,11,465);
  nameLines.slice(0,2).forEach((lineText,i)=>draw(page,lineText,64,539-i*14,bold,11));

  if (decided) {
    draw(page,"PRODUCT NAME",47,488,regular,8,muted);
    right(page,"QTY",W-200,488,regular,8,muted);
    right(page,"AMOUNT",W-47,488,regular,8,muted);
    page.drawLine({start:{x:47,y:475},end:{x:W-47,y:475},color:line,thickness:1});
    const lines=wrap(snapshot.productName!,bold,10.3,315);
    if (lines.length > 9) throw new Error("The Google Sheet product name is too long for a one-page invoice.");
    lines.forEach((lineText,i)=>draw(page,lineText,47,450-i*15,bold,10.3));
    right(page,"1",W-200,450,regular,10);
    right(page,amount(snapshot.productCost!),W-47,450,bold,10);
    const bottom=Math.min(418,450-(lines.length-1)*15-16);
    page.drawLine({start:{x:47,y:bottom},end:{x:W-47,y:bottom},color:line,thickness:1});
    right(page,"Order amount",W-157,bottom-35,regular,10,muted);
    right(page,amount(snapshot.productCost!),W-47,bottom-35,bold,11);
    right(page,"Advance paid",W-157,bottom-61,regular,10,muted);
    right(page,amount(snapshot.advancePaid),W-47,bottom-61,regular,11);
    const boxY=bottom-134;
    page.drawRectangle({x:W-291,y:boxY,width:244,height:51,color:ink});
    draw(page,"BALANCE TO BE PAID",W-275,boxY+18,regular,8.5,white);
    right(page,amount(snapshot.balance!),W-61,boxY+15,bold,16,white);
  } else {
    page.drawRectangle({x:47,y:427,width:W-94,height:61,color:pale});
    draw(page,"PRODUCT SELECTION",64,464,regular,8,muted);
    draw(page,"Pending confirmation",64,442,bold,11);
    page.drawRectangle({x:W-291,y:313,width:244,height:52,color:ink});
    draw(page,"ADVANCE PAID",W-275,333,regular,9,white);
    right(page,amount(snapshot.advancePaid),W-61,330,bold,16,white);
    draw(page,"Your product and final amount will be confirmed later.",47,281,regular,9,muted);
  }
  draw(page,"Thank you for choosing PurelyJid.",47,168,bold,11);
  draw(page,"Track your order at purelyjid.in/track-order",47,147,regular,9,muted);
  page.drawLine({start:{x:47,y:92},end:{x:W-47,y:92},color:line,thickness:1});
  draw(page,`Order ID: ${snapshot.orderId}`,47,72,regular,8,muted);
  right(page,"PurelyJid",W-47,72,bold,8,muted);
  return pdf.save();
}
