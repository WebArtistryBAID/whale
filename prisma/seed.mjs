// Development seed data. Run with `npx prisma db seed`. Refuses to run in production because it wipes the store.
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'
import sharp from 'sharp'

if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed a production database.')
    process.exit(1)
}

const SQL = `
TRUNCATE "Category","Tag","OptionType","OptionItem","ItemType","Order","OrderedItem","User","CouponCode","Ad","UserAuditLog","Notification" RESTART IDENTITY CASCADE;
INSERT INTO "User"(id,name,pinyin,phone,permissions,type,gender,balance,points,"updatedAt") VALUES
 (1001,'张三','Zhang San','13800000000','{admin.manage}','teacher','male','128.5','342',now()),
 (1002,'李四','Li Si','13900000000','{}','student','female','20','56',now());
INSERT INTO "Category"(name,"displayOrder") VALUES ('咖啡 Coffee',0),('茶饮 Tea',1),('甜点 Desserts',2);
INSERT INTO "Tag"(name,color) VALUES ('热销 Bestseller','red'),('新品 New','green');
INSERT INTO "OptionType"(name) VALUES ('温度 Temperature'),('甜度 Sweetness'),('杯型 Size');
INSERT INTO "OptionItem"("typeId",name,"displayOrder","default","priceChange") VALUES
 (1,'热 Hot',0,true,'0'),(1,'冰 Iced',1,false,'0'),
 (2,'标准 Regular',0,true,'0'),(2,'少糖 Less sugar',1,false,'0'),(2,'无糖 No sugar',2,false,'0'),
 (3,'中杯 Medium',0,true,'0'),(3,'大杯 Large',1,false,'3');
INSERT INTO "ItemType"("categoryId",name,image,description,"shortDescription","basePrice","salePercent","displayOrder") VALUES
 (1,'拿铁 Latte','latte.webp','经典意式浓缩与丝滑牛奶的融合。','Espresso with silky steamed milk','15','1',0),
 (1,'美式 Americano','americano.webp','浓缩咖啡加热水，清爽纯粹。','Espresso with hot water','12','1',1),
 (1,'摩卡 Mocha','mocha.webp','巧克力与咖啡的完美搭配。','Chocolate, espresso and milk','18','0.8',2),
 (2,'抹茶拿铁 Matcha Latte','matcha.webp','宇治抹茶搭配牛奶。','Uji matcha with milk','16','1',0),
 (2,'柠檬红茶 Lemon Tea','lemontea.webp','新鲜柠檬，清爽解腻。','Black tea with fresh lemon','10','1',1),
 (3,'可颂 Croissant','croissant.webp','法式黄油可颂。','Buttery French croissant','9','1',0);
UPDATE "ItemType" SET "countsTowardLimit"=false, "inventoryTrackingEnabled"=true, "remainingItems"=8 WHERE id=6;
INSERT INTO "_ItemTypeToOptionType"("A","B") SELECT i,o FROM generate_series(1,5) i, generate_series(1,3) o;
INSERT INTO "_ItemTypeToTag"("A","B") VALUES (1,1),(4,2);
INSERT INTO "CouponCode"(id,value,"allowedUses","remainingUses") VALUES ('WELCOME','5',10,10);
INSERT INTO "SettingsItem"(key, value) VALUES ('enable-scheduled-availability', 'false'), ('store-open', 'true'), ('maximum-cups-per-order', '4')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
`

const IMAGES = {
    latte: [ '#c8a27a', '#f3e3cf' ],
    americano: [ '#5b3a29', '#d9b99b' ],
    mocha: [ '#6b3e26', '#e8c9a8' ],
    matcha: [ '#7fa35b', '#e5efd6' ],
    lemontea: [ '#c9772b', '#fbe6b8' ],
    croissant: [ '#d79a3e', '#fbeed4' ]
}

async function writeImages() {
    const dir = process.env.UPLOAD_PATH ?? 'public/uploads'
    await fs.mkdir(dir, { recursive: true })
    for (const [ name, [ dark, light ] ] of Object.entries(IMAGES)) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient></defs><rect width="600" height="600" fill="url(#g)"/><ellipse cx="300" cy="430" rx="190" ry="34" fill="#00000022"/><path d="M180 220 h240 l-24 200 a30 30 0 0 1 -30 26 h-132 a30 30 0 0 1 -30 -26z" fill="#fff" opacity="0.92"/><path d="M420 260 a50 50 0 0 1 0 100" stroke="#fff" stroke-width="22" fill="none" opacity="0.92"/><ellipse cx="300" cy="222" rx="120" ry="18" fill="${dark}"/></svg>`
        await sharp(Buffer.from(svg)).webp().toFile(path.join(dir, `${name}.webp`))
    }
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
await client.connect()
try {
    await client.query(SQL)
    await writeImages()
    console.log('Seeded development data. Admin user id: 1001')
} finally {
    await client.end()
}
