import { db, serverTimestamp } from "./firebase.js";

// Load the seller profile for a signed-in user, creating a minimal one on first login.
export async function ensureSellerProfile(user){
  const uid=user.uid;
  const sellerDoc=await db.collection("sellers").doc(uid).get();
  if(sellerDoc.exists) return {info:{uid,...sellerDoc.data()},isNew:false};
  const profile={phone:user.phoneNumber||"",shopName:"",city:"Bakı",region:"baku",whatsapp:"",email:user.email||"",lastUpload:null};
  await db.collection("sellers").doc(uid).set({...profile,createdAt:serverTimestamp()});
  return {info:{uid,...profile},isNew:true};
}
