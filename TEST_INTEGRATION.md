# 🧪 Test Integration Guide

## 📋 **Sprawdź czy wszystko działa:**

### **1. 🏗️ Setup Database**
1. Idź do **Supabase Dashboard** → **SQL Editor**
2. Wklej kod z `SUPABASE_SETUP.md` i kliknij **Run**
3. Sprawdź **Table Editor** - powinna być tabela `campaigns` z przykładowymi danymi

### **2. 🚀 Uruchom aplikację**
```bash
npm start
```

### **3. ✅ Test step by step:**

#### **A. Base Account Connection**
- [ ] Kliknij **"Sign in with Base Account"**
- [ ] Status pokazuje: 🟢 **Connected**
- [ ] Adres uniwersalny jest widoczny

#### **B. Create Campaign** 
- [ ] Kliknij **"Create Campaign"**
- [ ] Wypełnij formularz:
  - Title: "Test Campaign"
  - Description: "Testing Supabase integration"
  - Goal: 1000 USDC
  - Category: Technology
  - Creator Nickname: "Tester"
- [ ] **Upload Image:**
  - Wklej URL: `https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800`
  - LUB przeciągnij plik JPG/PNG
- [ ] Kliknij **"🚀 Create Campaign"**

#### **C. Sprawdź rezultaty:**
- [ ] Console log: `📸 Uploading image to storage...`
- [ ] Console log: `✅ Campaign synced to Supabase successfully`
- [ ] W **Supabase Table Editor** - nowy rekord w tabeli `campaigns`
- [ ] W **Vercel Dashboard** → **Blob** - uploaded image

#### **D. Lista kampanii:**
- [ ] Kampanie z Supabase pojawiają się na liście
- [ ] Zdjęcia ładują się z Vercel Blob CDN
- [ ] Dane są aktualne (goal, progress, etc.)

### **4. 🔍 Debug jeśli coś nie działa:**

#### **Console Errors:**
```bash
# W przeglądarce F12 → Console
- Sprawdź błędy związane z Supabase
- Sprawdź błędy related z Vercel Blob
```

#### **Supabase Logs:**
```bash
# W Supabase Dashboard → Logs
- API logs - czy requesty dochodzą
- Database logs - czy inserting działa
```

#### **Network Tab:**
```bash
# F12 → Network → Sprawdź:
- POST do Supabase API
- PUT do Vercel Blob
- Status codes (200 = OK, 400/500 = błąd)
```

### **5. 🎯 Expected Flow:**

```
1. User signs in → Base Account SDK
2. User creates campaign → Viem encodeFunctionData 
3. Transaction sent → Base Sepolia network
4. Image uploaded → Vercel Blob storage
5. Campaign synced → Supabase database  
6. List updated → CampaignListSupabase component
```

### **6. 🛠️ Troubleshooting:**

| Problem | Solution |
|---------|----------|
| No Supabase connection | Check `.env.local` variables |
| Image upload fails | Check `BLOB_READ_WRITE_TOKEN` |
| Database insert fails | Check RLS policies in Supabase |
| Transaction fails | Check Base Account network (84532) |

### **7. 🎉 Success Indicators:**

- ✅ **Blockchain**: Transaction hash na Base Sepolia
- ✅ **Database**: New record w Supabase campaigns table  
- ✅ **Storage**: Image URL z `vercel-blob.com`
- ✅ **UI**: Campaign appears w liście z prawdziwymi danymi

**Jeśli wszystko działa - masz kompletny crowdfunding platform! 🚀**