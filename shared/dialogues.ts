export type Personality = 'polite' | 'rude' | 'recep' | 'thug' | 'vip' | 'drunk' | 'inspector';
export type DialogTrigger = 'entry' | 'waiting' | 'eating' | 'leaving_happy' | 'leaving_angry' | 'revenge';

export const DIALOGUES: Record<Personality, Record<DialogTrigger, string[]>> = {
    polite: {
        entry: [
            "Merhaba, kolay gelsin.", "Boş masa var mıdır?", "İyi günler şefim.", "Çok methettiler burayı.",
            "Selamlar, umarım yoğunsunuzdur.", "Kolaylıklar dilerim.", "Pardon, yer var mı?", "İyi çalışmalar, acıktım da.",
            "Güler yüzlü bir mekan, harika.", "Umarım güzel kokular mutfaktan geliyordur.", "Havanız çok hoşmuş, bayıldım.",
            "Açlıktan kendime gelemedim, ne şanslıyım ki buradayım.", "Hayırlı işler ustam.", "Kapıdan girer girmez iştahım açıldı.",
            "Selam, umarım menünüz zengindir.", "Arkadaşım tavsiye etti, deneyelim bakalım.", "İyi akşamlar, yeriniz var mı?",
            "Şahane bir mekan, tebrikler.", "Merhabalar, açlıktan başım döndü.", "Kolay gelsin, umarım boş yer vardır."
        ],
        waiting: [
            "Acaba siparişim yolda mı?", "Sabırsızlanıyorum doğrusu.", "Ortam çok nezihmiş.", "Müthiş kokular geliyor.",
            "Umarım çok beklemem.", "Garson bey/hanım, kolay gelsin.", "Biraz acıktım sanırım.", "Menüde hep güzel şeyler var.",
            "Dekorasyon cidden harika.", "Aşçı çok yoğun galiba.", "Burada müzik çok dinlendirici.", "Zaman geçmek bilmiyor, midem gurulduyor.",
            "Ustamın ellerine sağlık şimdiden.", "Diğer masalardaki yemekler çok iyi görünüyor.", "İçeceğimi yudumlarken sabırsızlıkla bekliyorum.",
            "Mutfaktaki telaş hoşuma gidiyor.", "Umarım siparişim sıradadır.", "Sabırla bekliyorum şefim.", "Kokular başımı döndürüyor.",
            "Biraz uzun sürdü sanırım, sorun değil."
        ],
        eating: [
            "Mmm, enfes olmuş.", "Tam istediğim gibi.", "Ellerinize sağlık, çok lezzetli.", "Tuzu tam kararında.",
            "Beklediğime değdi.", "Burası favori mekanım olacak.", "Aşçı işini gerçekten biliyor.", "Harika bir lezzet şöleni.",
            "Sıcacık servis edilmiş, teşekkürler.", "Çok güzelmiş, afiyetle yiyorum.", "Damağımda bıraktığı tat efsane.",
            "Porsiyonlar da oldukça doyurucuymuş.", "Malzemeler çok taze, belli oluyor.", "Gülümseten bir lezzet, bayıldım.",
            "Şefin ellerine sağlık, harika ötesi.", "Bu lezzeti herkese tavsiye edeceğim.", "Uzun zamandır böyle güzel yemek yemedim.",
            "Gerçekten övgüyü hak ediyor.", "Her lokması ayrı güzel.", "Sunum da lezzet kadar şahane."
        ],
        leaving_happy: [
            "Ellerinize sağlık, şahaneydi.", "Çok teşekkürler, yine geleceğim.", "Hayırlı işler, çok beğendim.", "Her şey mükemmeldi, sağ olun.",
            "Bol kazançlar dilerim.", "Gerçekten lezzetliydi, iyi günler.", "Üstü kalsın demeyi çok isterdim :)", "Mideniz bayram etti, tekrar görüşürüz.",
            "Çok naziksiniz, teşekkürler.", "Harika bir deneyimdi şefim.", "Görüşmek üzere, dostlarıma da tavsiye edeceğim.",
            "Bugün beni çok mutlu ettiniz, sağ olun.", "Yemeklerinize hayran kaldım, hoşça kalın.", "Müthiş bir servis, tekrar görüşmek üzere.",
            "İyi ki gelmişim, elinize sağlık.", "Çok keyifli bir akşamdı, teşekkürler.", "Hizmet kaliteniz harika.", "Yeni favori mekanım burası.",
            "Kazancınız bol olsun şefim.", "Tebrik ederim, işinizi iyi yapıyorsunuz."
        ],
        leaving_angry: [
            "Çok beklettiniz, maalesef gidiyorum.", "Hizmetiniz çok yavaş, üzgünüm.", "Vaktim yoktu, iptal edelim.",
            "Keşke biraz daha hızlı olsaydınız.", "Bu kadar da beklenmez ki canım.", "Açlıktan bayılmadığım için şanslıyım, gidiyorum.",
            "Bugün şanssız günümdeyim galiba.", "Maalesef hizmet sıfır.", "Bir daha geleceğimi sanmıyorum.", "Müşteri memnuniyeti hak getire...",
            "Bu ne sorumsuzluk, gidiyorum!", "Masada kök saldım resmen, pes!", "Böyle restoran mı olur, yazıklar olsun.",
            "Zamanım bitti, artık bekleyemeyeceğim.", "Müşteriye saygı kalmamış, elveda.", "Daha fazla bekleyemeyeceğim, kusura bakmayın.",
            "İlginiz çok zayıf, ayrılıyorum.", "Aç gelip aç gidiyorum, şaka gibi.", "Burası bana göre değilmiş.", "Hayal kırıklığına uğradım."
        ],
        revenge: [] // Polite tipler intikam almaz
    },
    rude: {
        entry: [
            "Hele şükür! Açız lan aç!", "Masayı hazırla seri yoksa dükkanı başına yıkarım.", "Bu ne biçim mekan lan, pavyon mu burası!", "Açlıktan midem sikildi, çabuk masa verin.",
            "Zehirlenmeyiz inşallah amk.", "Ulan sabahtan beri sizi bekliyoz yarrak kafalılar.", "Aşçı uyuyor mu içerde, dürtün şu pezevengi.",
            "Açım lan açım, şaka mısınız amına koyayım!", "Boş atıp dolu tutmaya gelmedik, yemeği getirin.", "Masayı kemiricem amk, çabuk olun.",
            "Şu dükkanda bize bakacak bir tane delikanlı yok mu!", "Hadi lan amcık ağızlılar, hızlı servis dediler geldik.", "Benim asabımı bozmayın, yemeğimi getirin.",
            "Kapıda ağaç olduk lan! Ağaç!", "Ne dikiliyorsun bön bön, masa ayarla!", "Sikecem dükkanınızı ha, ilgilenin bizle!",
            "Paramızla rezil olmaya geldik iyi mi.", "Bugün canım sıkkın zaten, beni delirtmeyin ulan!", "Şu mekana bak, ahırdan hallice.",
            "Ne bakıyon dik dik, yemek ver yemek!"
        ],
        waiting: [
            "Nerde kaldı ulan bu zıkkım?!", "Açlıktan götüm düştü be! Hadi amk!", "Aşçı içeride osuruyor herhalde.", "Siparişi siktiri boktan bi menüye niye yazdınız?!",
            "Bizden sonrakilere gitti yemekler, sizin ben adaletinizi sikeyim!", "Amına koduğumun menüsünü okumak suç mu, nerde yemek!", "Masayı yiyeceğim birazdan getirin şu orospu yemeğini.",
            "Fırına atıp sizi pişirecem şimdi!", "Hızlanın biraz lan, kaplumbağa yapsa daha hızlı olur be!", "Sizin yapacağınız servisin ben ta amk.",
            "Böyle yavaş servis sikiş hikayelerinde bile yok.", "Kendim pişirsem mideme daha çabuk inerdi pezevenkler.", "Ayakta 31 mi çekiyorsunuz lan, getirin yemeği!", 
            "Bir yemeği pişirmek kaç saat sürer dalyaraklar!", "Aga bu ne yavaşlık ya, siki tutacaz açlıktan!", "Masa altına yapıştık anasını satayım!", 
            "Yemeğin tarlasını mı sikiyorsunuz lan çıkmadı o yemek!", "Sinirden sikimi koparıcam şimdi!", "Getir ulan artık şu zıkkımın kökünü!"
        ],
        eating: [
            "İdare eder işte.", "Daha iyisini de yemiştim.", "Sos az olmuş ama yicez artık.", "Sıcakmış bare, neyse yiyelim.",
            "Bu ne biçim sunum kardeşim.", "Karnım doysun yeter, lezzet mühim değil.", "Aşçı bugün gününde değil herhalde.", "Yediğime değsin bare.",
            "Neyse ki açtım da göze batmıyor.", "Bir tık daha tuz koysanız iyiydi.", "Çok yağlı ama yutucaz mecbur.", "Görünüşü berbat ama tadı fena değil.",
            "Aç olmasam yemezdim bunu.", "Porsiyon da kuş yemi kadar.", "Soğumaya başlamış bile, rezalet!", "Yerken mideme oturdu valla.",
            "Plastik çiğniyorum sandım bi ara.", "Bu fiyata bu kalite... komedi.", "Çok pişmiş bu be, kömür gibi!", "Sosu iğrenç ama karnım aç."
        ],
        leaving_happy: [
            "Fena değildi, karnım doydu.", "Tuzu eksikti ama neyse artık.", "Hadi eyvallah.", "Paramın karşılığını yarım da olsa aldım.",
            "Yemek güzeldi ama servis yavaş! Gidiyorum.", "Eyvallah ustam.", "Daha iyi olabilirdi, neyse görüşürüz.", "Bu fiyata bu kadar, iyi günler.",
            "Bir dahakine daha hızlı olun.", "Hadi kolay gelsin, bahşiş beklemeyin.", "Doyduk çok şükür, gidiyorum ben.", "Bir daha yolum düşerse gelirim belki.",
            "Yemek fena değildi, hadi eyvallah.", "Gereksiz bekledik ama tadı kurtardı.", "Yedik içtik, kalkalım artık.", "Param gitti ama midem doldu.",
            "Çok övülecek bir şey yok, hadi bay.", "Şiştim lan, neyse eyvallah.", "Garson çok baktı ama doyduk sonunda.", "Sonraki sefere daha çok et isterim."
        ],
        leaving_angry: [
            "Sizin yapacağınız işe tüküreyim, gidiyorum ben!", "Bu ne rezalet, aç kaldık!", "Bir daha buraya adım atarsam iki olsun!",
            "Gidin başka iş yapın kardeşim siz!", "Müşteriyle nasıl ilgilenileceğini bilmiyorsunuz!", "Rezalet mekan! Kimseye tavsiye etmem!",
            "Hem yavaşsınız hem beceriksiz, yuh!", "Lanet olsun ya, restorana bak!", "Mekanı kapatın bence siz!", "Açlıktan bayılıcam, terbiyesizlik bu!",
            "Ben böyle saygısızlık görmedim!", "Bir tabak yemeği getiremediniz be!", "Zamanım sizin yüzünüzden çöpe gitti!",
            "Aptal gibi bekledik burada, lanet olsun!", "Şikayet edicem burayı, reziller!", "Burayı yakasım var şu an!", "Böyle işletmenin canı cehenneme!",
            "Aptal herifler, yürü git işine!", "Verdiğim saniye haram olsun!", "Polis çağırıcam lan rezalet bu!"
        ],
        revenge: [] // Rude'un revenge repliği yok, the Thug söyleyecek bunları
    },
    recep: {
        entry: [
            "Böhhhhhöööyyyt! Anam babam, erzağı yığın buraya!", "Agam menüyü komple bana getir!", "Lan bura ne biçim ahır, yemi suyu verin hemen!",
            "Hooooop! Şefim, acımdan duvarı tırmalayacam!", "Aslanım, İvedik geldi masayı donat!", "Bana ordan yağlı mağlı bir şeyler ateşle!",
            "Gonuşma lan! Direk yemeği getir!", "Midesi guruldayan bir canavar geldi açılın lan!", "Kim bakıyor ulan bu dükkana, açlıktan geberiyoz!",
            "Cüzdanı bıraktım eve ama midem dolu gidecem, hadi koçum!", "Hööööyt! Salih abiniz geldi mekana!", "Şşşt, alo! Midem isyanda, tez yemek getirin!",
            "Ulan dükkanın tapusunu üstüme mi yapsam napsam!", "Böhöhöyt, kokulara bak kafa yapıyor yeminle!", "Masanın en kralını bana ayırın lan dümbelekler!",
            "Pala remziye benzeyecem açlıktan, seri olun!", "Dana gibi yerim bugün valla, yığın masaya!", "Gürrül gürrül geldim, doymadan gitmem!",
            "Hadi oğlum şef! Şovunu yap görelim!", "Böhöhöyt! Ulan mekana bak civciv yuvası gibi!"
        ],
        waiting: [
            "Lan yavrum, pişmedi mi şu zıkkım!", "Anam babam beni mi sınıyonuz, çabuk olun!", "Agam bu fırının ateşi yetmiyor mu odun atayım mı?",
            "Ulan midem sırtıma yapıştı, hadi be!", "Bana bak aşçı parçası, gelmiyim oraya ha!", "Lan garson, nassı gidiyor? Yemeği yaktınız mı yoksa dümbelekler!",
            "Sabrım taşıyor, böhhhöyyyt fırlatıcam masayı şimdi!", "Lan oğlum öööyle bakma, yemeği getir yemeği!", "Agam ölecez açlıktan, gözüm dönüyor bak!",
            "Cık cık cık... Bu ne yavaşlık amk, kaplumbağa mısınız!", "Ulan yemeği tarladan mı biçip getiriyorsunuz?", "Lan açlıktan kendi kolumu kemiricem şimdi!",
            "Hadi lan, fırının içine girip ben pişirecem yemeği!", "Oğlum bak asabım bozuluyor, çabuk olun!", "Masa örtüsünü yicem az kaldı, getirin lan!",
            "Böhöhöyt! Ulan bittiniz siz, masa uçuyor bak!", "Ahıra çevircem burayı yemek gelmezse!", "Gözüm kararıyor lan, şekerim düştü amk!",
            "Ulan koca herif eridi aktı masada be!", "Garsooon! Alooooo! Duyan yok mu lan!"
        ],
        eating: [
            "Ammaaaan, loküm gibi loküm!", "Ulan yemin ediyorum sanat eseri be, hüpletirim bunu!", "Şlop şlop şlop... (hayvan gibi yeme sesleri)",
            "Lan bu nasıl sos, anaaam bayılacam lezzetten!", "Agam elinize sağlık, mideme cila çektim!", "Oha, yeminle 10 numara, ağzıma layık!",
            "Lan oğlum çok iyi bu, ver bir porsiyon daha!", "Ağağağağa çok sıcak be! Ama yiycem!", "İşte bu be, damak çatlatan dedikleri bu olsa gerek!",
            "(Öğğğk) Pardon geğirdim, çok efsane olmuş ustam!", "Hamm humm mmm... (Ağzı doluyken konuşma)", "Şap şup şap şup... Hayatımda yediğim en iyi zıkkım!",
            "Lan sosu burnuma kaçtı ama olsun, süper!", "Böhöhöyt! Porsiyon da bana göre maşallah!", "Dişim kırılsa da yicem bunu, o derece süper!",
            "Milyar versen bunu bırakmam arkadaş!", "Hadi lan! Yedikçe yiyesi geliyor adamın!", "Yaladım yuttum lan, tabak pırıl pırıl!",
            "Yeminle ağlıycam mutluluktan, bu ne olm!", "Ulan anam babam görse bu iştahla gurur duyar!"
        ],
        leaving_happy: [
            "Agam adamsınız be, tokadı basıp helalleşesim geldi!", "Lan oğlum çok doyurdu bu beni, eyvallah kocaman!", "Helal olsun ustam, paranın hakkını verdiniz de para yok!",
            "Yine gelecem oğlum, mönüyü bana ayırın!", "Anam babam ellerinize sağlık, şahanesiniz böhöhöyt!", "Aşçı bey, gel seni bi öpeyim anlından şapadanak!",
            "Burası benim mekan, adamın hasısınız lan!", "Hadi Allah'a emanet, karnımı davul gibi yaptınız sağolun!", "Siz bu işi biliyonuz, cillop gibi restoran valla!",
            "Böhöhöyt, eyvallah koçum bereket versin!", "Lan garson, bahşiş bekliyorsan avucunu yalarsın, hadi eyvallah!", "Ulan yemekler iyiydi de hesabı yandakine kilitledim ha!",
            "Canavara dönmüştüm, beni insanlığa geri döndürdünüz be!", "Hadi gari ben kaçar, dükkana mukayyet olun!", "Kürdanımı da aldım, sekiyorum buradan!",
            "Adamı vezir edersiniz vallahi, helal!", "Efsane ortam efsane tıkınmaca, böhöhöyt!", "Tüm sülaleyi toplayıp gelecem lan buraya!",
            "Kralını yesinler, en iyi mekanı bulmuşum amk!", "Ulan o kadar mutluyum ki havalara uçasım var!"
        ],
        leaving_angry: [
            "Ulan amk böyle işin, aç kaldık lan!", "Kapatın ulan bu dükkanı, rezalet yemin ediyorum!", "Lan oğlum dümbelek misiniz siz, yemek veremediniz be!",
            "Sizin yapacağınız mekana tüküreyim, gidiyom ben amk!", "Aç aç yolluyorsunuz adamı, Allah cezanızı verecek!", "Lan gelip fırını kafanıza geçirmeden gidiyorum, dua edin!",
            "O kadar bekledik bir cacık gelmedi, tövbe estağfurullah!", "Agam siz dükkancılık falan oynamayın bırakın bu işleri!", "Deli edersiniz lan adamı, gidip dürüm yiycem sokakta amk!",
            "Bu ne biçim çalışma tarzı lan, gidin çay satın siz ahrazlar!", "Ulan masayı kafanıza geçirmeden gidiyom, şanslısınız!", "Burayı esnaflar odasına şikayet etmezsem adam değilim!",
            "Açlıktan midem delindi ulan, böyle iş mi olur!", "Tepemi attırdınız lan, restorana bak kerhane gibi!", "Hadi lan oradan, sizin yapacağınız yemeğin içine edeyim!",
            "Masayı kırsam yeridir lan dümbelek takımı!", "Sabrımın sonuna geldik, siktirip gidiyom!", "Size verdiğim krediye yazıklar olsun amk!",
            "Dükkanınızı da yemeğinizi de başınıza çalın!", "Lan oğlum asabımı bozdunuz sizin ben yüzünüzü şey edeyim!"
        ],
        revenge: [] // Recep'in intikamcıları Thug tipi olacak
    },
    thug: { // YENİ: Vurulan müşterinin arkadaşları
        entry: [],
        waiting: [
            "Nerde lan benim adamıma vuran o amcık hoşafı!",
            "Kim ulan benim kardeşime el kaldıran gavat!",
            "Mekanı başınıza yıkmaya geldim amına koduklarım!",
            "Kardeşime vuran ellerinizi götünüze sokarım sizin!",
            "Adamsanız çıkın lan karşıma, sikecem belanızı teke tek!",
            "Arkadaşımın hesabı fena sorulacak lan burada sürtükler!",
            "Topunuza dalarım amk çocukları, kimi vurdunuz lan!",
            "Dükkanı yakıcam lan, nerde o kabadayı ibne!",
            "Şimdi bittiniz olm, aşçıyı o fırına atıp amına koycam!",
            "Benim dostuma el kaldırmak ne demekmiş ecdadınızı sikecem!",
        ],
        eating: [
            "İyi yemek... ama bu bizi kurtarmaz.",
            "Şlop şlop... Hesabı kapatıyoruz sonra.",
            "Güzel pişirmiş, yazık olacak.",
            "Ye kardeşim ye, güç lazım olacak.",
        ],
        leaving_happy: [
            "Bu sefer geçtiniz... Bu sefer.",
            "Lezzetliydi. Ama unutmadık.",
            "Eyvallah aşçı. Bir dahaki sefere daha dikkatli ol.",
            "Gidiyoruz... Şimdilik.",
        ],
        leaving_angry: [
            "Tamam. Tamam. Anladık.",
            "Beklettiniz. Bunu not ettik.",
            "Gidin lan, zaten planımız vardı.",
        ],
        revenge: [
            "Nerde lan benim adamıma vuran o amcık hoşafı!",
            "Kim ulan benim kardeşime el kaldıran gavat!",
            "Mekanı başınıza yıkmaya geldim amına koduklarım!",
            "Kardeşime vuran ellerinizi götünüze sokarım sizin!",
            "Adamsanız çıkın lan karşıma, sikecem belanızı teke tek!",
            "Arkadaşımın hesabı fena sorulacak lan burada sürtükler!",
            "Topunuza dalarım amk çocukları, kimi vurdunuz lan!",
            "Dükkanı yakıcam lan, nerde o kabadayı ibne!",
            "Şimdi bittiniz olm, aşçıyı o fırına atıp amına koycam!",
            "Benim dostuma el kaldırmak ne demekmiş ecdadınızı sikecem!",
            "Ödettirmeye geldim lan, mekanın tapusunu götünüze monte edicem!",
            "Yazıklar olsun ulan ibneler, adam mı oldunuz başımıza!",
            "Karşim sen rahat ol, şimdi bunların anasını avradını teker teker...",
            "Lan o lavuk buraya gelecek yoksa dükkanın ebesini sikerim!",
            "Gelin lan teker teker, alayınızı ipe dizip sikecem!",
            "Kim ulan o yarrak kafalı şef! Çıksın karşıma çabuk amk!"
        ]
    },
    vip: {
        entry: [
            "İyi günler. Rezervasyonum var.", "Burayı çok tavsiye ettiler, görelim.",
            "Masam hazır mı?", "Umarım kalite beklentilerimi karşılar.",
            "Merhaba. En iyi masanızı istiyorum.", "Şef burada mı? Selamlarımı iletin.",
        ],
        waiting: [
            "Biraz uzun sürüyor...", "Kaliteli hizmet sabır ister, anlıyorum.",
            "Siparişim ne zaman gelecek acaba?", "Diğer masalar önce mi servis aldı?",
            "Vaktim kıymetli, lütfen hızlanın.", "Beklemeye alışkın değilim açıkçası.",
        ],
        eating: [
            "Fena değil... beklentilerimi karşılıyor.", "Sunum biraz daha özenli olabilirdi.",
            "Lezzet iyi, puan veriyorum.", "Malzeme kalitesi belli oluyor, aferin.",
            "Bir dahaki sefere daha iyi olur umarım.", "Şefin ellerine sağlık.",
        ],
        leaving_happy: [
            "Beklentilerimi karşıladınız, tebrikler.", "Bahşişi hak ettiniz.",
            "Arkadaşlarıma tavsiye edeceğim.", "Kalite vardı, tekrar gelirim.",
            "Memnun ayrılıyorum, elinize sağlık.", "İyi iş çıkardınız.",
        ],
        leaving_angry: [
            "Bu hizmet seviyesi kabul edilemez.", "Beklentilerimin çok altında kaldınız.",
            "Bir daha gelmeyeceğim, emin olun.", "Şikayetimi ilgili yerlere ileteceğim.",
            "Vaktimi boşa harcattınız.", "Hayal kırıklığı yaşadım.",
        ],
        revenge: [],
    },
    drunk: {
        entry: [
            "Heyyyy! Burasıı çok güüzel!", "Arkadaşlar nerede? Ah ben geldim!",
            "Yemek istiyorum... ya da içki... ikisi de olur!",
            "Merhaba güzel insan! Masa var mı?", "Burası mı... evet burası!",
            "Hepinizi seviyorum! Yemek getirin!",
        ],
        waiting: [
            "Yemek geliyor mu? Geliyor mu?", "Ben buradayım! Unutmadınız mı?",
            "Çok güzel bir yer burası... ne yiyordum ben?",
            "Arkadaşım nerede gitti acaba...", "Beklemek güzel... her şey güzel!",
            "Yemek... evet yemek istiyorum... sanırım.",
        ],
        eating: [
            "Mmm bu çok güzel! Yoksa kötü mü? Güzel!", "Yiyorum işte, ne güzel!",
            "Bu ne yemek? Fark etmez, yiyorum!", "Lezzzetli! Sanırım...",
            "Herkese ısmarlıyorum! Ah param yok...", "Şef dahi biri!",
        ],
        leaving_happy: [
            "Hepinizi seviyorum! Güle güle!", "Çok güzeldi! Ne yedim bilmiyorum ama güzeldi!",
            "Tekrar geleceğim! Yarın mı? Bugün mü?", "Eyvallah dostlar!",
            "Harika bir gece! Gündüz mü? Fark etmez!", "Sizi seviyorum!",
        ],
        leaving_angry: [
            "Neden bu kadar beklettiniz... üzüldüm.", "Gidiyorum... nereye gidiyorum?",
            "Açım hâlâ... bu doğru mu?", "Tamam tamam gidiyorum...",
            "Üzgünüm... siz de üzgün müsünüz?", "Elveda güzel mekan...",
        ],
        revenge: [],
    },
    inspector: {
        entry: [
            "Sağlık müfettişiyim. Denetim zamanı.", "Belgelerin hazır mı?",
            "Mutfak hijyenini kontrol edeceğim.", "Şikayetler üzerine geldim.",
            "Resmi denetim. Lütfen normal çalışmaya devam edin.",
            "Ruhsatınızı görmek istiyorum.",
        ],
        waiting: [
            "Servis süresi ölçülüyor.", "Bekleme süresi standartları aşıyor.",
            "Not alıyorum...", "Bu gecikme raporda yer alacak.",
            "Standart bekleme süresi 8 dakikadır.", "Saatim çalışıyor.",
        ],
        eating: [
            "Malzeme tazeliği... kabul edilebilir.", "Sunum standartlara uygun.",
            "Lezzet değerlendirmesi yapılıyor.", "Pişirme süresi uygun görünüyor.",
            "Hijyen notu: iyi.", "Porsiyon standardı... yeterli.",
        ],
        leaving_happy: [
            "Denetim tamamlandı. Sonuçlar olumlu.", "Standartları karşılıyorsunuz.",
            "Raporunuz temiz çıktı.", "Tebrikler, devam edin.",
            "Bu sefere geçtiniz.", "Belgeleri düzenli tutun.",
        ],
        leaving_angry: [
            "Rapor olumsuz. Ceza kesilecek.", "Standartların altında hizmet.",
            "Kapatma kararı değerlendiriliyor.", "Bu durum kabul edilemez.",
            "Resmi uyarı verildi.", "Bir dahaki denetimde daha dikkatli olun.",
        ],
        revenge: [],
    },
};
