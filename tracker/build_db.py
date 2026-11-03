import json, re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from tags import TAGS

# Source: Wikipedia "List of best-selling manga" (retrieved 2026-11-01)
# Columns: title | authors | publisher | demographic | volumes | serialized | sales_millions | flags
# flags: c = figure is copies in circulation/print (Wikipedia dagger), d = includes digital sales (double dagger)
RAW = """
One Piece|Eiichiro Oda|Shueisha|Shōnen|115|1997–present|600|cd
Doraemon|Fujiko F. Fujio|Shogakukan|Children|45|1969–1996|300|
Golgo 13|Takao Saito, Saito Production|Shogakukan|Seinen|221|1968–present|300|c
Case Closed / Detective Conan|Gosho Aoyama|Shogakukan|Shōnen|108|1994–present|270|c
Dragon Ball|Akira Toriyama|Shueisha|Shōnen|42|1984–1995|260|
Naruto|Masashi Kishimoto|Shueisha|Shōnen|72|1999–2014|250|c
Demon Slayer: Kimetsu no Yaiba|Koyoharu Gotouge|Shueisha|Shōnen|23|2016–2020|220|cd
Slam Dunk|Takehiko Inoue|Shueisha|Shōnen|31|1990–1996|185|c
KochiKame: Tokyo Beat Cops|Osamu Akimoto|Shueisha|Shōnen|201|1976–2016|157.2|c
Jujutsu Kaisen|Gege Akutami|Shueisha|Shōnen|30|2018–2024|150|cd
Crayon Shin-chan|Yoshito Usui, UY Team|Futabasha|Seinen|65|1990–present|148|c
Attack on Titan|Hajime Isayama|Kodansha|Shōnen|34|2009–2021|140|cd
Oishinbo|Tetsu Kariya, Akira Hanasaki|Shogakukan|Seinen|111|1983–2014 (on hiatus)|135|c
Bleach|Tite Kubo|Shueisha|Shōnen|74|2001–2016|130|c
JoJo's Bizarre Adventure|Hirohiko Araki|Shueisha|Shōnen / Seinen|139|1987–present|120|c
Kingdom|Yasuhisa Hara|Shueisha|Seinen|79|2006–present|120|cd
Astro Boy|Osamu Tezuka|Kobunsha|Shōnen|23|1952–1968|100|
Baki the Grappler|Keisuke Itagaki|Akita Shoten|Shōnen|156|1991–present|100|c
Fist of the North Star|Buronson, Tetsuo Hara|Shueisha|Shōnen|27|1983–1988|100|
Hajime no Ippo|George Morikawa|Kodansha|Shōnen|145|1989–present|100|c
Hunter × Hunter|Yoshihiro Togashi|Shueisha|Shōnen|39|1998–present|100|cd
The Kindaichi Case Files|Yōzaburō Kanari, Seimaru Amagi, Fumiya Satō|Kodansha|Shōnen / Seinen|102|1992–present|100|c
My Hero Academia|Kōhei Horikoshi|Shueisha|Shōnen|42|2014–2024|100|cd
Touch|Mitsuru Adachi|Shogakukan|Shōnen|26|1981–1986|100|
Captain Tsubasa|Yōichi Takahashi|Shueisha|Shōnen / Seinen|110|1981–2024|90|c
Fullmetal Alchemist|Hiromu Arakawa|Enix; Square Enix|Shōnen|27|2001–2010|90|c
Sazae-san|Machiko Hasegawa|Kodansha||68|1946–1974|86|
Kinnikuman|Yudetamago|Shueisha|Shōnen / Seinen|93|1979–1987, 2011–present|85|c
Vagabond|Takehiko Inoue|Kodansha|Seinen|37|1998–2015 (on hiatus)|82|
Sangokushi|Mitsuteru Yokoyama|Ushio Shuppansha|Shōnen|60|1971–1986|80|
Tokyo Revengers|Ken Wakui|Kodansha|Shōnen|31|2017–2022|80|cd
Haikyu!!|Haruichi Furudate|Shueisha|Shōnen|45|2012–2020|75|c
Gintama|Hideaki Sorachi|Shueisha|Shōnen|77|2003–2019|73|cd
Fairy Tail|Hiro Mashima|Kodansha|Shōnen|63|2006–2017|72|c
Rurouni Kenshin|Nobuhiro Watsuki|Shueisha|Shōnen|28|1994–1999|72|cd
Berserk|Kentaro Miura, Kouji Mori, Studio Gaga|Hakusensha|Seinen|43|1989–present|70|cd
Major|Takuya Mitsuda|Shogakukan|Shōnen|110|1994–present|66.66|c
Blue Lock|Muneyuki Kaneshiro, Yusuke Nomura|Kodansha|Shōnen|39|2018–present|65|cd
That Time I Got Reincarnated as a Slime|Fuse, Taiki Kawakami|Kodansha|Shōnen|32|2015–present|62|c
Boys Over Flowers|Yoko Kamio|Shueisha|Shōjo|37|1992–2003|61|c
The Prince of Tennis|Takeshi Konomi|Shueisha|Shōnen|42|1999–2008|60|c
Rokudenashi Blues|Masanori Morita|Shueisha|Shōnen|42|1988–1997|60|c
The Apothecary Diaries|Hyūganatsu, Minoji Kurata, Nekokurage|Square Enix; Shogakukan|Seinen|39|2017–present|57|cd
Initial D|Shuichi Shigeno|Kodansha|Seinen|48|1995–2013|56|c
Bad Boys|Hiroshi Tanaka|Shōnen Gahōsha|Seinen|22|1988–1996|55|c
H2|Mitsuru Adachi|Shogakukan|Shōnen|34|1992–1999|55|c
Ranma ½|Rumiko Takahashi|Shogakukan|Shōnen|38|1987–1996|55|c
The Seven Deadly Sins|Nakaba Suzuki|Kodansha|Shōnen|68|2012–present|55|cd
Shura no Mon|Masatoshi Kawahara|Kodansha|Shōnen|31|1987–1996|55|cd
Minami no Teiō|Dai Tennōji, Rikiya Gō|Nihon Bungeisha|Shōnen|188|1992–2026|53|c
Super Radical Gag Family|Kenji Hamaoka|Akita Shoten|Shōnen|107|1993–present|51|c
City Hunter|Tsukasa Hojo|Shueisha|Shōnen|35|1985–1991|50|c
Cobra|Buichi Terasawa|Shueisha|Shōnen|18|1978–1984|50|c
Devilman|Go Nagai|Kodansha|Shōnen|5|1972–1973|50|c
Dragon Quest: The Adventure of Dai|Riku Sanjo, Koji Inada|Shueisha|Shōnen|37|1989–1996|50|c
Fisherman Sanpei|Takao Yaguchi|Kodansha|Shōnen|65|1973–1983|50|c
Glass Mask|Suzue Miuchi|Hakusensha|Shōjo|49|1976–2012 (on hiatus)|50|c
Great Teacher Onizuka|Tooru Fujisawa|Kodansha|Shōnen|25|1997–2002|50|
Inuyasha|Rumiko Takahashi|Shogakukan|Shōnen|56|1996–2008|50|c
Nana|Ai Yazawa|Shueisha|Shōjo|21|2000–2009 (on hiatus)|50|c
Saint Seiya|Masami Kurumada|Shueisha|Shōnen|28|1985–1990|50|
Shoot!|Tsukasa Ōshima|Kodansha|Shōnen|66|1990–2003|50|c
YuYu Hakusho|Yoshihiro Togashi|Shueisha|Shōnen|19|1990–1994|50|
Dokaben|Shinji Mizushima|Akita Shoten|Shōnen|205|1972–2018|48|c
Black Jack|Osamu Tezuka|Akita Shoten|Shōnen|25|1973–1983|47.66|
Kosaku Shima|Kenshi Hirokane|Kodansha|Seinen|92|1983–present|47|cd
Tokyo Ghoul|Sui Ishida|Shueisha|Seinen|30|2011–2018|47|c
Crows|Hiroshi Takahashi|Akita Shoten|Shōnen|26|1990–1998|46|c
Sailor Moon|Naoko Takeuchi|Kodansha|Shōjo|18|1991–1997|46|cd
Shizukanaru Don – Yakuza Side Story|Tatsuo Nitta|Jitsugyo no Nihon Sha|Seinen|108|1988–2013|46|c
Ace of Diamond|Yuji Terajima|Kodansha|Shōnen|81|2006–2022|45|c
Dear Boys|Hiroki Yagami|Kodansha|Shōnen|101|1989–present|45|c
Shonan Junai Gumi|Tooru Fujisawa|Kodansha|Shōnen|31|1990–1996|45|c
Yu-Gi-Oh!|Kazuki Takahashi|Shueisha|Shōnen|38|1996–2004|44|c
The Promised Neverland|Kaiu Shirai, Posuka Demizu|Shueisha|Shōnen|20|2016–2020|43|cd
Spy × Family|Tatsuya Endo|Shueisha|Shōnen|17|2019–present|42|c
Shaman King|Hiroyuki Takei|Shueisha; Kodansha|Shōnen|32|1998–2004|41|c
Be-Bop High School|Kazuhiro Kiuchi|Kodansha|Seinen|48|1983–2003|40|
Cooking Papa|Tochi Ueyama|Kodansha|Seinen|178|1985–present|40|c
Crest of the Royal Family|Chieko Hosokawa|Akita Shoten|Shōjo|71|1976–present|40|c
Kyō Kara Ore Wa!!|Hiroyuki Nishimori|Shogakukan|Shōnen|38|1988–1997|40|c
Nodame Cantabile|Tomoko Ninomiya|Kodansha|Josei|25|2001–2010|39|c
One-Punch Man|One, Yusuke Murata|Shueisha|Seinen|37|2012–present|38|cd
Black Butler|Yana Toboso|Square Enix|Shōnen|35|2006–present|36|c
Chainsaw Man|Tatsuki Fujimoto|Shueisha|Shōnen|24|2018–2026|36|cd
Kimi ni Todoke|Karuho Shiina|Shueisha|Shōjo|30|2005–2017|36|cd
The Chef|Mai Tsurugina, Tadashi Katou|Nihon Bungeisha|Seinen|41|1985–1993|35|c
Chibi Maruko-chan|Momoko Sakura|Shueisha|Shōjo|18|1986–2022|35|cd
Frieren: Beyond Journey's End|Kanehito Yamada, Tsukasa Abe|Shogakukan|Shōnen|15|2020–present|35|c
Itazura na Kiss|Kaoru Tada|Shueisha|Shōjo|23|1990–1999|35|c
Salary Man Kintaro|Hiroshi Motomiya|Shueisha|Seinen|30|1994–2002|35|c
Space Brothers|Chūya Koyama|Kodansha|Seinen|46|2007–2026|35|cd
Urusei Yatsura|Rumiko Takahashi|Shogakukan|Shōnen|34|1978–1987|35|c
Worst|Hiroshi Takahashi|Akita Shoten|Shōnen|33|2002–2013|35|c
Yowamushi Pedal|Wataru Watanabe|Akita Shoten|Shōnen|101|2008–present|35|c
3×3 Eyes|Yuzo Takada|Kodansha|Seinen|40|1987–2002|33.33|c
Kaze Densetsu: Bukkomi no Taku|Hiroto Saki, Juzo Tokoro|Kodansha|Shōnen / Seinen|27|1991–1997|33|c
Hell Teacher: Jigoku Sensei Nube|Shō Makura, Takeshi Okano|Shueisha|Shōnen|31|1993–1999|32|cd
The Silent Service|Kaiji Kawaguchi|Kodansha|Seinen|32|1988–1996|32|cd
A Certain Magical Index|Kazuma Kamachi|Square Enix|Shōnen|33|2007–present|31|c
Kuroko's Basketball|Tadatoshi Fujimaki|Shueisha|Shōnen|30|2008–2014|31|c
Bastard!!|Kazushi Hagiwara|Shueisha|Shōnen / Seinen|27|1988–2012 (on hiatus)|30|c
Chameleon|Atsushi Kase|Kodansha|Shōnen|47|1990–2000|30|c
Death Note|Tsugumi Ohba, Takeshi Obata|Shueisha|Shōnen|12|2003–2006|30|c
Dr. Slump|Akira Toriyama|Shueisha|Shōnen|18|1980–1984|30|c
The Fable|Katsuhisa Minami|Kodansha|Seinen|36|2014–present|30|cd
Fruits Basket|Natsuki Takaya|Hakusensha|Shōjo|23|1998–2006|30|c
Gaki Deka|Tatsuhiko Yamagami|Akita Shoten|Shōnen|26|1974–1980|30|c
Golden Kamuy|Satoru Noda|Shueisha|Seinen|31|2014–2022|30|c
Jarinko Chie|Etsumi Haruki|Futabasha|Seinen|67|1978–1997|30|c
Jingi|Tachihara Ayumi|Akita Shoten|Seinen|66|1988–2017|30|c
Kaiji|Nobuyuki Fukumoto|Kodansha|Seinen|91|1996–present|30|c
Pokémon Adventures|Hidenori Kusaka, Mato, Satoshi Yamamoto|Shogakukan|Children|64|1997–present|30|c
Reborn!|Akira Amano|Shueisha|Shōnen|42|2004–2012|30|c
Tokimeki Tonight|Koi Ikeno|Shueisha|Shōjo|30|1982–1994|30|c
Toriko|Mitsutoshi Shimabukuro|Shueisha|Shōnen|43|2008–2016|30|c
Ushio and Tora|Kazuhiro Fujita|Shogakukan|Shōnen|33|1990–1996|30|c
Yawara!|Naoki Urasawa|Shogakukan|Seinen|29|1986–1993|30|c
Futari Ecchi|Katsu Aki|Hakusensha|Seinen|95|1997–present|29.5|cd
Chihayafuru|Yuki Suetsugu|Kodansha|Josei|50|2007–2022|29|c
Shonan Bakusozoku|Satoshi Yoshida|Shōnen Gahōsha|Shōnen|16|1982–1988|29|c
Asari-chan|Mayumi Muroyama|Shogakukan|Shōjo|100|1978–2014|28|c
Assassination Classroom|Yūsei Matsui|Shueisha|Shōnen|21|2012–2016|27|c
D.Gray-man|Katsura Hoshino|Shueisha|Shōnen|29|2004–present|27|c
Eyeshield 21|Riichiro Inagaki, Yusuke Murata|Shueisha|Shōnen|37|2002–2009|27|cd
Sakigake!! Otokojuku|Akira Miyashita|Shueisha|Shōnen|34|1985–1991|27|c
Seito Shokun!|Yoko Shoji|Kodansha|Shōjo / Josei|79|1977–2019|27|c
Yūkan Club|Yukari Ichijo|Shueisha|Shōjo|19|1982–2002|27|
20th Century Boys|Naoki Urasawa|Shogakukan|Seinen|22|1999–2006|26.4|c
Bari Bari Densetsu|Shuichi Shigeno|Kodansha|Shōnen|38|1983–1991|26|c
Tsuribaka Nisshi|Jūzō Yamasaki, Kenichi Kitami|Shogakukan|Seinen|118|1979–present|26|c
Angel Heart|Tsukasa Hojo|Shinchosha; Tokuma Shoten|Seinen|49|2001–2017|25|c
Aoashi|Yugo Kobayashi, Naohiko Ueno|Shogakukan|Seinen|40|2015–2025|25|cd
Ashita no Joe|Ikki Kajiwara, Tetsuya Chiba|Kodansha|Shōnen|20|1968–1973|25|c
Black Clover|Yūki Tabata|Shueisha|Shōnen|38|2015–2026|25|cd
Blue Exorcist|Kazue Kato|Shueisha|Shōnen|34|2009–present|25|c
Boys Be...|Masahiro Itabashi, Hiroyuki Tamakoshi|Kodansha|Shōnen|58|1991–2001|25|c
Emblem Take 2|Kazumasa Kiuchi, Jun Watanabe|Kodansha|Seinen|62|1990–2004|25|c
Flame of Recca|Nobuyuki Anzai|Shogakukan|Shōnen|33|1995–2002|25|c
Fushigi Yûgi|Yuu Watase|Shogakukan|Shōjo / Josei|34|1991–present|25|c
Hikaru no Go|Yumi Hotta, Takeshi Obata|Shueisha|Shōnen|23|1998–2003|25|c
Magi: The Labyrinth of Magic|Shinobu Ohtaka|Shogakukan|Shōnen|37|2009–2017|25|c
Maison Ikkoku|Rumiko Takahashi|Shogakukan|Seinen|15|1980–1987|25|c
Miyuki|Mitsuru Adachi|Shogakukan|Shōnen|12|1980–1984|25|c
Neon Genesis Evangelion|Yoshiyuki Sadamoto|Kadokawa Shoten|Shōnen|14|1994–2013|25|
Oh My Goddess!|Kōsuke Fujishima|Kodansha|Seinen|48|1988–2014|25|c
Oshi no Ko|Aka Akasaka, Mengo Yokoyari|Shueisha|Seinen|16|2020–2024|25|cd
Patalliro!|Mineo Maya|Hakusensha|Shōjo|104|1979–present|25|c
Parasyte|Hitoshi Iwaaki|Kodansha|Seinen|10|1989–1994|25|c
The Ping Pong Club|Minoru Furuya|Kodansha|Seinen|13|1993–1996|25|c
Saiyuki|Kazuya Minekura|Square Enix; Ichijinsha|Shōnen / Shōjo / Josei|27|1997–present|25|c
Tasogare Ryūseigun|Kenshi Hirokane|Shogakukan|Seinen|79|1995–present|25|c
Ahiru no Sora|Takeshi Hinata|Kodansha|Shōnen|51|2004–2019 (on hiatus)|24|c
Gantz|Hiroya Oku|Shueisha|Seinen|37|2000–2013|24|c
Kaguya-sama: Love Is War|Aka Akasaka|Shueisha|Seinen|28|2015–2022|24|c
Zatch Bell!|Makoto Raiku|Shogakukan|Shōnen|33|2001–2007|23.8|cd
Rave Master|Hiro Mashima|Kodansha|Shōnen|35|1999–2005|23.5|c
Giant Killing|Masaya Tsunamoto, Tsujitomo|Kodansha|Seinen|70|2007–present|23|c
Himitsu Series|Yasuko Uchiyama, Tokuo Yokota, Terumi Fujiki, Yoshitari Iizuka|Gakken|Children|116|1972–2014|23|c
The Rose of Versailles|Riyoko Ikeda|Shueisha|Shōjo|10|1972–1973|23|c
Ushijima the Loan Shark|Shohei Manabe|Shogakukan|Seinen|46|2004–2019|23|c
Abu-san|Shinji Mizushima|Shogakukan|Seinen|107|1973–2014|22|c
Cardcaptor Sakura|Clamp|Kodansha|Shōjo|28|1996–2023|22|cd
Don't Call It Mystery|Yumi Tamura|Shogakukan|Josei|16|2016–present|22|cd
Hayate the Combat Butler|Kenjiro Hata|Shogakukan|Shōnen|52|2004–2017|22|c
Hoshin Engi|Ryu Fujisaki|Shueisha|Shōnen|23|1996–2000|22|c
Made in Abyss|Akihito Tsukushi|Takeshobo|Shōnen|14|2012–present|22|c
Swan|Kyoko Ariyoshi|Shueisha|Shōjo|21|1976–1981|22|c
Terra Formars|Yū Sasuga, Kenichi Tachibana|Shueisha|Seinen|23|2011–present|22|c
Dōbutsu no Oisha-san|Noriko Sasaki|Hakusensha|Shōjo|12|1987–1993|21.6|c
Osu! Karate Club|Koji Takahashi|Shueisha|Seinen|43|1985–1996|21|c
Rookies|Masanori Morita|Shueisha|Shōnen|24|1998–2003|21|c
Tsubasa: Reservoir Chronicle|Clamp|Kodansha|Shōnen|28|2003–2009|21|
Dragon Quest: The Mark of Erdick|Chiaki Kawamata, Junji Koyanagi, Kamui Fujiwara|Enix|Shōnen|21|1991–1997|20.9|c
Soul Eater|Atsushi Ohkubo|Square Enix|Shōnen|25|2004–2013|20.4|c
Shōnen Shōjo Nippon no Rekishi|Kōta Kodama, Arakawa Shoji|Shogakukan|Children|24|1981–2018|20.2|c
750 Rider|Isami Ishii|Akita Shoten|Shōnen|50|1975–1985|20|c
Buddha|Osamu Tezuka|Ushio Shuppan|Seinen|14|1972–1983|20|c
Cat's Eye|Tsukasa Hojo|Shueisha|Shōnen|18|1981–1985|20|c
Cuffs – Kizu Darake no Chizu|Jin Tojo|Shueisha|Seinen|32|1997–2005|20|c
Dr. Stone|Riichiro Inagaki, Boichi|Shueisha|Shōnen|27|2017–2022|20|cd
Fire Force|Atsushi Ohkubo|Kodansha|Shōnen|34|2015–2022|20|c
Food Wars!: Shokugeki no Soma|Yūto Tsukuda, Shun Saeki|Shueisha|Shōnen|36|2012–2019|20|c
Haruhi Suzumiya|Makoto Mizuno, Gaku Tsugano, Puyo, Eretto|Kadokawa Shoten|Shōnen|20|2005–2013|20|c
Keiji|Keiichiro Ryu, Tetsuo Hara|Shueisha|Shōnen|18|1990–1993|20|c
Kimagure Orange Road|Izumi Matsumoto|Shueisha|Shōnen|18|1984–1987|20|c
Love Hina|Ken Akamatsu|Kodansha|Shōnen|14|1998–2001|20|c
Master Keaton|Naoki Urasawa, Hokusei Katsushika, Takashi Nagasaki|Shogakukan|Seinen|18|1988–1994|20|c
Mazinger Z|Go Nagai|Shueisha; Kodansha|Shōnen|5|1972–1974|20|c
Monster|Naoki Urasawa|Shogakukan|Seinen|18|1994–2001|20|
Negima! Magister Negi Magi|Ken Akamatsu|Kodansha|Shōnen|38|2003–2012|20|c
Peacock King|Makoto Ogino|Shueisha; Shogakukan; Leed|Seinen|45|1985–2019|20|c
The Quintessential Quintuplets|Negi Haruba|Kodansha|Shōnen|14|2017–2020|20|c
Record of Ragnarok|Shinya Umemura, Takumi Fukui, Azychika|Coamix|Seinen|28|2017–present|20|c
Red River|Chie Shinohara|Shogakukan|Shōjo|28|1995–2002|20|c
Shōnen Ashibe|Hiromi Morishita|Shueisha|Seinen|8|1988–1994|20|
Sukeban Deka|Shinji Wada|Hakusensha|Shōjo|22|1976–1982|20|c
Tokyo Daigaku Monogatari|Tatsuya Egawa|Shogakukan|Seinen|34|1992–2001|20|c
Weed|Yoshihiro Takahashi|Nihon Bungeisha|Seinen|60|1999–2009|20|c
Welcome to Demon School! Iruma-kun|Osamu Nishi|Akita Shoten|Shōnen|49|2017–present|20|cd
"""

def slug(s):
    s = s.lower().replace("×", "x").replace("½", "half")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

def parse_serialized(text):
    hiatus = "on hiatus" in text
    core = text.replace("(on hiatus)", "").strip()
    years = [int(y) for y in re.findall(r"\d{4}", core)]
    ongoing = core.endswith("present")
    status = "hiatus" if hiatus else ("ongoing" if ongoing else "completed")
    return {
        "display": text,
        "start_year": years[0] if years else None,
        "end_year": None if ongoing else (years[-1] if years else None),
        "publication_status": status,
    }

items = []
for i, line in enumerate(l for l in RAW.strip().splitlines() if l.strip()):
    title, authors, pub, demo, vols, ser, sales, flags = [p.strip() for p in line.split("|")]
    items.append({
        "id": slug(title),
        "title": title,
        "media_type": "manga",
        "creators": [a.strip() for a in authors.split(",")],
        "publishers": [p.strip() for p in pub.split(";")],
        "demographics": [d.strip() for d in demo.split("/")] if demo else [],
        "volumes": int(vols),
        "serialization": parse_serialized(ser),
        "popularity": {
            "sales_rank": i + 1,
            "approx_sales_millions": float(sales),
            "figure_is_circulation": "c" in flags,
            "includes_digital": "d" in flags,
        },
        "genres": TAGS[title].split(),
        "related": [],
        "user": {
            "status": None,          # planned | in_progress | completed | dropped | on_hold
            "rating": None,          # e.g. 1-10
            "progress": None,        # volumes/chapters read
            "started": None,
            "finished": None,
            "favorite": False,
            "notes": "",
        },
    })

ids = [x["id"] for x in items]
assert len(ids) == len(set(ids)), "duplicate ids"

db = {
    "schema_version": 1,
    "generated": "2026-11-01",
    "sources": [{
        "name": "Wikipedia: List of best-selling manga",
        "url": "https://en.wikipedia.org/wiki/List_of_best-selling_manga",
        "retrieved": "2026-11-01",
        "notes": "All series with 20M+ collected tankōbon copies. Sales rank follows the article's order (ties alphabetical).",
    }],
    "enums": {
        "media_type": ["manga", "anime_series", "anime_film", "light_novel", "video_game"],
        "user.status": ["planned", "in_progress", "completed", "dropped", "on_hold"],
    },
    "items": items,
}

with open("anime_media_db.json", "w", encoding="utf-8") as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

print(len(items), "items written")
missing=[t for t in TAGS if t not in {x["title"] for x in items}]
assert not missing, missing
compact=[[x["id"],x["title"],", ".join(x["creators"]),"/".join(x["demographics"]),x["volumes"],x["serialization"]["start_year"],x["serialization"]["end_year"],x["serialization"]["publication_status"][0],x["popularity"]["approx_sales_millions"],x["genres"]] for x in items]
open("lib.json","w",encoding="utf-8").write(json.dumps(compact,ensure_ascii=False,separators=(",",":")))
print("ongoing:", sum(x["serialization"]["publication_status"] == "ongoing" for x in items))
