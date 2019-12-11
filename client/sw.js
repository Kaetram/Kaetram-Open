/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

workbox.core.skipWaiting();

workbox.core.clientsClaim();

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "audio/music/beach.mp3",
    "revision": "bb712dd9c179a93a4cc4e16954481c16"
  },
  {
    "url": "audio/music/codingroom.mp3",
    "revision": "793237a957672987964006a1f12cb7d4"
  },
  {
    "url": "audio/music/meadowofthepast.mp3",
    "revision": "2328eff40ab016ad4f41d9f9ca693eab"
  },
  {
    "url": "audio/music/smalltown.mp3",
    "revision": "80e03cedc8bcc521c6b1f80825f75d62"
  },
  {
    "url": "audio/music/spookyship.mp3",
    "revision": "8846239677536208cad583d4b7cdcff7"
  },
  {
    "url": "audio/music/village.mp3",
    "revision": "0b7082f359d0756ecd75db1350ace864"
  },
  {
    "url": "audio/sounds/achievement.mp3",
    "revision": "860a88ffb4aefc715e3c47ac2c472a06"
  },
  {
    "url": "audio/sounds/chat.mp3",
    "revision": "75e930f9db387ef0ec037f258cb446aa"
  },
  {
    "url": "audio/sounds/chest.mp3",
    "revision": "31548fe4c756f7f1666c649a79879ebc"
  },
  {
    "url": "audio/sounds/death.mp3",
    "revision": "8af3be715318441738897bea78791ed8"
  },
  {
    "url": "audio/sounds/firefox.mp3",
    "revision": "3efb00bca5851c981f3d94e68f5e0dfd"
  },
  {
    "url": "audio/sounds/heal.mp3",
    "revision": "12ec52530df678f9c91b624d45106985"
  },
  {
    "url": "audio/sounds/hit1.mp3",
    "revision": "d1fa84357d76f3d2b0a38ad9811908ae"
  },
  {
    "url": "audio/sounds/hit2.mp3",
    "revision": "728e2dc02776b2fa5e0d82b0273c6145"
  },
  {
    "url": "audio/sounds/hurt.mp3",
    "revision": "d24464381e3a085d96875477454a623a"
  },
  {
    "url": "audio/sounds/kill1.mp3",
    "revision": "1e30715c42bb78ceca9e81a26cfd0a72"
  },
  {
    "url": "audio/sounds/kill2.mp3",
    "revision": "28f95a8e1cd61416f47cee7701e31fe5"
  },
  {
    "url": "audio/sounds/loot.mp3",
    "revision": "40d6fe1c8cdf0c673f4c6dafa5200009"
  },
  {
    "url": "audio/sounds/noloot.mp3",
    "revision": "e630bf800e441194384d0a800454d0bb"
  },
  {
    "url": "audio/sounds/npc-end.mp3",
    "revision": "e612e475a1d8f01479c23f42353ffac1"
  },
  {
    "url": "audio/sounds/npc.mp3",
    "revision": "397474715bfafc930f48f22550a3f97c"
  },
  {
    "url": "audio/sounds/npctalk.mp3",
    "revision": "cbcc39892cdfb3d9d784c89762b7166d"
  },
  {
    "url": "audio/sounds/revive.mp3",
    "revision": "34939ef954a5ee80f939f0666057fabc"
  },
  {
    "url": "audio/sounds/teleport.mp3",
    "revision": "e7323edd76d6af9909a5e300d745f11c"
  },
  {
    "url": "browserconfig.xml",
    "revision": "45a3c9fe825bd2857bc24f14c69d46da"
  },
  {
    "url": "css/animations.css",
    "revision": "ee1eeeb9ff4a21bc7534a26b92e071db"
  },
  {
    "url": "css/game.css",
    "revision": "1c5301d456aed7d2d5d519743b4ea042"
  },
  {
    "url": "css/interface.css",
    "revision": "a3d51492ebaea50b25bb6c9244421ee6"
  },
  {
    "url": "css/main.css",
    "revision": "865db92f78c545781c331c5caa89a326"
  },
  {
    "url": "css/vars.css",
    "revision": "1ab3d9c7c7d8e66bafa4989c0956010c"
  },
  {
    "url": "data/config.json",
    "revision": "02f0d8794fcd0b506ad019cde83e8a6e"
  },
  {
    "url": "data/config.json-dist",
    "revision": "d48b1c76d3e9f68f2b1ae5e3e699b3fc"
  },
  {
    "url": "data/maps/map.js",
    "revision": "a94f85ba1322899dfcd3619470046151"
  },
  {
    "url": "data/maps/map.json",
    "revision": "3a1a5264a0b7ac44881794b2b707af90"
  },
  {
    "url": "data/sprites.json",
    "revision": "060355f2ab86dcea72be9b7b305daf1f"
  },
  {
    "url": "favicon.ico",
    "revision": "8b2c195090507ff540eccf7732a89aa7"
  },
  {
    "url": "fonts/advocut/advocut-webfont.eot",
    "revision": "bb2383a9a52c72b47f5b8bd5be6f96ba"
  },
  {
    "url": "fonts/advocut/advocut-webfont.svg",
    "revision": "2068079474cb10cace62d5a13c024015"
  },
  {
    "url": "fonts/advocut/advocut-webfont.ttf",
    "revision": "07d93c3733967754597454d79a71f8e1"
  },
  {
    "url": "fonts/advocut/advocut-webfont.woff",
    "revision": "633aac12f2255fa1cf7211a7db48cab8"
  },
  {
    "url": "img/1/bank.png",
    "revision": "af64d1b84d4e700ff9e0a6d55b387a2b"
  },
  {
    "url": "img/1/border.png",
    "revision": "25f047a482e4595536d6885891990f8b"
  },
  {
    "url": "img/1/buttons.png",
    "revision": "6920996abb04e143665c727867705171"
  },
  {
    "url": "img/1/characterdialogsheet.png",
    "revision": "9e845ae46a504e03f2a8481a9f9be276"
  },
  {
    "url": "img/1/containers.png",
    "revision": "8a06517b7021cd91e3c401d0f21b8984"
  },
  {
    "url": "img/1/main.png",
    "revision": "278f44efae7a9963c8072eb4a8aa60c6"
  },
  {
    "url": "img/1/maintwo.png",
    "revision": "21785775ab93ea7ba5513141e8cc4156"
  },
  {
    "url": "img/1/mapframe.png",
    "revision": "b0a93770b2ecdeabc42865c6deb07e19"
  },
  {
    "url": "img/1/mapicons.png",
    "revision": "03b1105459be17c16208852db07e231b"
  },
  {
    "url": "img/1/pointer.png",
    "revision": "29542dbc4c77fb91267f51db56980167"
  },
  {
    "url": "img/1/skillicons.png",
    "revision": "bf01eb07afccb456886cd0ca7bf04b60"
  },
  {
    "url": "img/1/skillslots.png",
    "revision": "e872e5fe5a954f6d7780501ac48104e8"
  },
  {
    "url": "img/1/spritesheet.png",
    "revision": "d68b30f4abff2ac0d51e4748f5374daa"
  },
  {
    "url": "img/1/trade.png",
    "revision": "71be44c264ab18b1a1c69bac29c3ce98"
  },
  {
    "url": "img/2/bank.png",
    "revision": "eaf2f279ccaca6502ad584e2302eb0a0"
  },
  {
    "url": "img/2/border.png",
    "revision": "d57012b9cfab99724d94c6b327aeb29d"
  },
  {
    "url": "img/2/buttons.png",
    "revision": "c7bbb81e6cb7fb54b27446bfb887a840"
  },
  {
    "url": "img/2/characterdialogsheet.png",
    "revision": "10d3673339186853449c1cd21945d95a"
  },
  {
    "url": "img/2/containers.png",
    "revision": "be6d2394b3de03ac47276dc93d8c966f"
  },
  {
    "url": "img/2/item-adhererarcherarmor.png",
    "revision": "d21c371eadfa2fbc6241049997897ad7"
  },
  {
    "url": "img/2/item-adhererrobe.png",
    "revision": "751a50e4e7a42852e8304004ceefde73"
  },
  {
    "url": "img/2/item-adminarmor.png",
    "revision": "f0497d05a0fe27c7712d44b8f868650a"
  },
  {
    "url": "img/2/item-apple.png",
    "revision": "c8f8ac70d3da411238a3f17181a95bd9"
  },
  {
    "url": "img/2/item-archerarmor.png",
    "revision": "45cf67184463d43062dae7373fc5a2d2"
  },
  {
    "url": "img/2/item-archerschooluniform.png",
    "revision": "ccdef22e88ce734d99f95d83c357ecc3"
  },
  {
    "url": "img/2/item-armorbinding.png",
    "revision": "96a9c70f83a62fb5744c310b8e006534"
  },
  {
    "url": "img/2/item-armorcommon.png",
    "revision": "d597f0b2901e11278bf0555ef54a329e"
  },
  {
    "url": "img/2/item-armorpatches.png",
    "revision": "d1c1a4f94db08d9e982b4bc0f28aa2d4"
  },
  {
    "url": "img/2/item-armorrare.png",
    "revision": "cc5da97d9af1d57ab834fd9b85732f03"
  },
  {
    "url": "img/2/item-armoruncommon.png",
    "revision": "9c8ff424c004389d8afd85bb89255fd2"
  },
  {
    "url": "img/2/item-axe.png",
    "revision": "f1e37b69e1cd47e63776c03d1cc1ae44"
  },
  {
    "url": "img/2/item-bamboospear.png",
    "revision": "077170e816db47603609d8fd1dd5dc38"
  },
  {
    "url": "img/2/item-banana.png",
    "revision": "3b336f2c7690b2eeb00e16aba395ce69"
  },
  {
    "url": "img/2/item-bastardsword.png",
    "revision": "b380efce52949d33c4dd214791a39d68"
  },
  {
    "url": "img/2/item-bearseonbiarmor.png",
    "revision": "413ffa96da1ae188023a6860d2c34e33"
  },
  {
    "url": "img/2/item-beautifullife.png",
    "revision": "a846ea54060f13eb159ac8a03f89067c"
  },
  {
    "url": "img/2/item-beearmor.png",
    "revision": "19c1a345c96e1aefa5b360fbdb75af57"
  },
  {
    "url": "img/2/item-beetlearmor.png",
    "revision": "4c859d32b58459d9891edbd24853a8a6"
  },
  {
    "url": "img/2/item-bigflask.png",
    "revision": "ae3a56db9ae7ce9920274b45b8cffcc0"
  },
  {
    "url": "img/2/item-blackpotion.png",
    "revision": "8d80c835d7ab3a398b8837019cf83d1c"
  },
  {
    "url": "img/2/item-blackspiderarmor.png",
    "revision": "7e4bbd186aa39adffb8f75ae1de942dc"
  },
  {
    "url": "img/2/item-bloodbow.png",
    "revision": "4ef5466fe4fb45da16fef0a6dd3e11b4"
  },
  {
    "url": "img/2/item-bluedamboarmor.png",
    "revision": "23c7eb1115119e3df38080eb9fb9e255"
  },
  {
    "url": "img/2/item-bluepiratearmor.png",
    "revision": "9494a504287299b09ab124571d50342a"
  },
  {
    "url": "img/2/item-bluescimitar.png",
    "revision": "8e6c016bb401fdf85d36ebec6bddb21d"
  },
  {
    "url": "img/2/item-bluesword.png",
    "revision": "49a77a3aa4c69941b4a94cb5ee9f3f01"
  },
  {
    "url": "img/2/item-bluewingarcherarmor.png",
    "revision": "77530646930f4d33c6d10ac4b35bb15b"
  },
  {
    "url": "img/2/item-bluewingarmor.png",
    "revision": "35f35e03ff4cd9893f724926cdad24a3"
  },
  {
    "url": "img/2/item-book.png",
    "revision": "169037efbe425cd2304bd7fe4a24474e"
  },
  {
    "url": "img/2/item-bowcommon.png",
    "revision": "788195d18c73f5e786444486fc17b5ec"
  },
  {
    "url": "img/2/item-bowlimb.png",
    "revision": "02d0d233a52e0254c3f3d9b6f6d4ac3c"
  },
  {
    "url": "img/2/item-bowrare.png",
    "revision": "6ba72f600e5b791211310beae839a092"
  },
  {
    "url": "img/2/item-bowstring.png",
    "revision": "dfc2fc34a9a7e033e0eaa07cdb008ea9"
  },
  {
    "url": "img/2/item-bowuncommon.png",
    "revision": "5d745530d60a70f39beb2b359a20acc9"
  },
  {
    "url": "img/2/item-branch.png",
    "revision": "1b17754b63d73764e19b0716103a6c57"
  },
  {
    "url": "img/2/item-breaker.png",
    "revision": "d888c8e670ae7988a6fbf2d187893fbf"
  },
  {
    "url": "img/2/item-bridalmask.png",
    "revision": "7a6e82cfad3bacba35d927114f34d5bd"
  },
  {
    "url": "img/2/item-burger.png",
    "revision": "22c28b0af97f65f1f46f5c30e617768f"
  },
  {
    "url": "img/2/item-burgerarmor.png",
    "revision": "2d0d187432d9b15274e66476ae455837"
  },
  {
    "url": "img/2/item-butcherknife.png",
    "revision": "8d764b144acf4e28c8c95449b770377c"
  },
  {
    "url": "img/2/item-cactusaxe.png",
    "revision": "1449fb15f20b36ba74d5ce45e4becc17"
  },
  {
    "url": "img/2/item-cake.png",
    "revision": "25892da4e170b7699f5093afa9095bf0"
  },
  {
    "url": "img/2/item-candybar.png",
    "revision": "1d304029fcf16398c0e874d69be1db7a"
  },
  {
    "url": "img/2/item-captainbow.png",
    "revision": "6adb6cd25fdc5bcc73b450011b0007ba"
  },
  {
    "url": "img/2/item-catarmor.png",
    "revision": "ae04584aa15181e6833bc3f8b7172e33"
  },
  {
    "url": "img/2/item-cd.png",
    "revision": "b01bd9546f84ae247fcf232a265e4b8c"
  },
  {
    "url": "img/2/item-cheoliarcherarmor.png",
    "revision": "6f513ebf06326c543f2fcee81342f231"
  },
  {
    "url": "img/2/item-cheoliarmor.png",
    "revision": "2cd6971d53e3501b6a17f4e663b49e00"
  },
  {
    "url": "img/2/item-christmasarmor.png",
    "revision": "3d4331f8e0ac3d412f54b0d6198fedec"
  },
  {
    "url": "img/2/item-cloth.png",
    "revision": "bd75e8759daa2748289a3be51849059c"
  },
  {
    "url": "img/2/item-clotharmor.png",
    "revision": "c5f3d4c078999bc4faf574aeba90e8d7"
  },
  {
    "url": "img/2/item-cockroachsuit.png",
    "revision": "4defc9199569f06bc4df482fbc0391a7"
  },
  {
    "url": "img/2/item-cokearmor.png",
    "revision": "bad0fe07d32738f59f1b2dc12b31a008"
  },
  {
    "url": "img/2/item-comb.png",
    "revision": "f0a631242729cfaad3ef1616f16d6150"
  },
  {
    "url": "img/2/item-combatuniform.png",
    "revision": "23fc3bfba419633c2d3491d2fd04f254"
  },
  {
    "url": "img/2/item-conferencecall.png",
    "revision": "538d5303c5c5c459af03ba19aedebc7e"
  },
  {
    "url": "img/2/item-crystalarcherarmor.png",
    "revision": "52190db7dc5c18d74514a2243870ed12"
  },
  {
    "url": "img/2/item-crystalarmor.png",
    "revision": "7e914ae594a3987f898606baeb1f770d"
  },
  {
    "url": "img/2/item-crystalbow.png",
    "revision": "f7444e84470de4c98a87a412b1e48862"
  },
  {
    "url": "img/2/item-damboarmor.png",
    "revision": "38c8b2f5669545683a5340664c6bb156"
  },
  {
    "url": "img/2/item-daywalker.png",
    "revision": "2173b0d5785f07008d151490c7d95586"
  },
  {
    "url": "img/2/item-deathbow.png",
    "revision": "a129441a2b667e3a3a0a24b8d80b75de"
  },
  {
    "url": "img/2/item-devilkazyaarmor.png",
    "revision": "517a13e575db1cd2df5079a025a91c5b"
  },
  {
    "url": "img/2/item-devilkazyasword.png",
    "revision": "7f48514c86e0342e330e9ab24be96237"
  },
  {
    "url": "img/2/item-diamondring.png",
    "revision": "be9ea2566d36cb7e5cfeb70699de7184"
  },
  {
    "url": "img/2/item-dinosaurarmor.png",
    "revision": "9d677e66cb682a1cc6eea3e9848fdfd1"
  },
  {
    "url": "img/2/item-dolring.png",
    "revision": "fa66fdb101b9dca5c395d8fb9db9b64f"
  },
  {
    "url": "img/2/item-dovakinarcherarmor.png",
    "revision": "c9ae2fdf2313841d1193c79b0b63c60d"
  },
  {
    "url": "img/2/item-dovakinarmor.png",
    "revision": "55e0f968e75f07ca097b297eddee4c32"
  },
  {
    "url": "img/2/item-dragonarmor.png",
    "revision": "c1f9d54585e45dd789f48942bb20151d"
  },
  {
    "url": "img/2/item-element.png",
    "revision": "28df1ebdffc365d58331f750b282e6b5"
  },
  {
    "url": "img/2/item-emeraldring.png",
    "revision": "4638dd7a9c7fcb1a82671449ec61fa58"
  },
  {
    "url": "img/2/item-enelarmor.png",
    "revision": "f221dc646e3e77f6ec11cc8a7b978fdd"
  },
  {
    "url": "img/2/item-eneltrident.png",
    "revision": "583bb9e23fc593438ca18850a005124c"
  },
  {
    "url": "img/2/item-essentialrage.png",
    "revision": "ca15c6868023cba6680e956c588ca0e0"
  },
  {
    "url": "img/2/item-evilarmor.png",
    "revision": "c683baf19992c478ed5d2ba9f20329a3"
  },
  {
    "url": "img/2/item-fallenarcherarmor.png",
    "revision": "3937dbb72767be78cfb2d6de217ad51e"
  },
  {
    "url": "img/2/item-fallenarmor.png",
    "revision": "b37b2fab862c94fdeaaabec53bcda574"
  },
  {
    "url": "img/2/item-fireplay.png",
    "revision": "e9189d2854e450141df3ea66623a8025"
  },
  {
    "url": "img/2/item-firepotion.png",
    "revision": "eb6314be8df41b6f9c609d3a1cdacbf3"
  },
  {
    "url": "img/2/item-fireshot.png",
    "revision": "1e399a2121f6581b38df3382df50691e"
  },
  {
    "url": "img/2/item-firesword.png",
    "revision": "5155b75125aa1402069b7c8c938480eb"
  },
  {
    "url": "img/2/item-flask.png",
    "revision": "60880bddaf4cb748e3e0e71069999132"
  },
  {
    "url": "img/2/item-forestbow.png",
    "revision": "55f771d8181ff2385cdc5a1c2e5834e2"
  },
  {
    "url": "img/2/item-forestguardiansword.png",
    "revision": "329690640a36553da8648f8db2c11708"
  },
  {
    "url": "img/2/item-frankensteinarmor.png",
    "revision": "4c16dbf3758e474570c4ad8b1d644535"
  },
  {
    "url": "img/2/item-friedpotatoarmor.png",
    "revision": "2cdec79995f9c2b23a363f0a080ca6cc"
  },
  {
    "url": "img/2/item-frogarmor.png",
    "revision": "864b5e9f18fdebc6692331eb0a65bbd2"
  },
  {
    "url": "img/2/item-frostarmor.png",
    "revision": "e65718b893d16d57b852da47e16639db"
  },
  {
    "url": "img/2/item-gayarcherarmor.png",
    "revision": "d93d77de2f69a475da3be789dd2ce2b1"
  },
  {
    "url": "img/2/item-gayarmor.png",
    "revision": "ca7ab6acf93b622b1634c65b6d8093cf"
  },
  {
    "url": "img/2/item-gaybow.png",
    "revision": "a9387970ea1b62b3bf364b1ab2ad6e07"
  },
  {
    "url": "img/2/item-gbwingarcherarmor.png",
    "revision": "f7f74b4a5fd100923aacffa3156d6b92"
  },
  {
    "url": "img/2/item-gbwingarmor.png",
    "revision": "258ce65d906e5360a2e691a3e0e8abe5"
  },
  {
    "url": "img/2/item-ghostrider.png",
    "revision": "e8f10db5c2ba53e69f921094f8fb24ff"
  },
  {
    "url": "img/2/item-gold.png",
    "revision": "e4d1cb1116034a8411de4a949d85ac61"
  },
  {
    "url": "img/2/item-goldaxe.png",
    "revision": "303b0d36e37ac9128ec3a1db0b055002"
  },
  {
    "url": "img/2/item-goldenarcherarmor.png",
    "revision": "fde7496587b9e994078ded5b4017d780"
  },
  {
    "url": "img/2/item-goldenarmor.png",
    "revision": "d741262dd7b6e79532fac530cc725ac0"
  },
  {
    "url": "img/2/item-goldenbow.png",
    "revision": "c307c793ce50514bf178e715a8759da1"
  },
  {
    "url": "img/2/item-goldensword.png",
    "revision": "544e5d5df228cb0e5a77be0450ae07d8"
  },
  {
    "url": "img/2/item-goldring.png",
    "revision": "79b557c4c1d65eee7f2f6d78b5c7899d"
  },
  {
    "url": "img/2/item-greenarcherarmor.png",
    "revision": "91fd715bd051cf99db4683bc4e5f7033"
  },
  {
    "url": "img/2/item-greenarmor.png",
    "revision": "87fa3c8deace9d65cb25f55420e8fade"
  },
  {
    "url": "img/2/item-greenbow.png",
    "revision": "0605c5c8f94dd98f07b44b3210b64d3c"
  },
  {
    "url": "img/2/item-greendamboarmor.png",
    "revision": "a201c956894c59fe048b24f4bc9bfa2f"
  },
  {
    "url": "img/2/item-greenlightbow.png",
    "revision": "3a61fd063bd7d51e72a4376012df67be"
  },
  {
    "url": "img/2/item-greenlightsaber.png",
    "revision": "d6570c25571de0896f08194087fcb1a0"
  },
  {
    "url": "img/2/item-greenpendant.png",
    "revision": "a6d7841987d99363b64ba7a45cb55518"
  },
  {
    "url": "img/2/item-greenwingarcherarmor.png",
    "revision": "5b34ab0cfaea8afd85dac69bf7c5942e"
  },
  {
    "url": "img/2/item-greenwingarmor.png",
    "revision": "c3a2c0e03dab1ee11618a276207a0996"
  },
  {
    "url": "img/2/item-guardarcherarmor.png",
    "revision": "1aae1bd4beecad8b6c25a0b3eb851a37"
  },
  {
    "url": "img/2/item-guardarmor.png",
    "revision": "38c47559fbe0725e42b1aefe8016a542"
  },
  {
    "url": "img/2/item-halberd.png",
    "revision": "95d5917263819f6a5583e2a26ddc9770"
  },
  {
    "url": "img/2/item-halloweenjkarmor.png",
    "revision": "40d7f34a2410af3015540b8cd178b13e"
  },
  {
    "url": "img/2/item-hammer.png",
    "revision": "52f5e0a627a1ac8791dc54c07e3bb634"
  },
  {
    "url": "img/2/item-hongcheolarmor.png",
    "revision": "674f61957e061d55e270074d65803f7a"
  },
  {
    "url": "img/2/item-huniarmor.png",
    "revision": "56dba934cfd7b62541b4609935714344"
  },
  {
    "url": "img/2/item-hunterbow.png",
    "revision": "32dffe87af865ce28fefabcec052623c"
  },
  {
    "url": "img/2/item-icerose.png",
    "revision": "a9b15611a957ef67f2f05bc81bb92ba9"
  },
  {
    "url": "img/2/item-ironbow.png",
    "revision": "19a31a1ff80e892c3759ffa042185515"
  },
  {
    "url": "img/2/item-ironknightarmor.png",
    "revision": "9dc4739e987f8b603960dce28644a7d0"
  },
  {
    "url": "img/2/item-justicebow.png",
    "revision": "5faa47eb3ff0f21489f10aa9abe46758"
  },
  {
    "url": "img/2/item-justicehammer.png",
    "revision": "f1e03d384b1e0d1ed7d399e68075ad57"
  },
  {
    "url": "img/2/item-leaf.png",
    "revision": "35dd4e7a314c7bedc7ceeffa6995785d"
  },
  {
    "url": "img/2/item-leatherarcherarmor.png",
    "revision": "6336f422fa51d3a29b9d070ee33d7dd0"
  },
  {
    "url": "img/2/item-leatherarmor.png",
    "revision": "67c0707291194b6e6fa253e2c727b6b9"
  },
  {
    "url": "img/2/item-legolasarmor.png",
    "revision": "43c7abbb81465db19f65dcf49141d44f"
  },
  {
    "url": "img/2/item-loveactring.png",
    "revision": "f0e22fd5c696825d98b540a6670f9412"
  },
  {
    "url": "img/2/item-machete.png",
    "revision": "26a428f4ecf9c4b5d385b2ab9832169c"
  },
  {
    "url": "img/2/item-magicspear.png",
    "revision": "feb9fe9def1295bcfc0ec64d36f3cebc"
  },
  {
    "url": "img/2/item-mailarcherarmor.png",
    "revision": "c402fe8e631bdcb7fb59dd522c5abea2"
  },
  {
    "url": "img/2/item-mailarmor.png",
    "revision": "564e479009fd5d25465fc8029fe345e4"
  },
  {
    "url": "img/2/item-manaflask.png",
    "revision": "72d3796680ead5e059a901458c8c8631"
  },
  {
    "url": "img/2/item-marblependant.png",
    "revision": "5e97a442c3242b81b7910f06623c5207"
  },
  {
    "url": "img/2/item-marinebow.png",
    "revision": "a9e5714d76163712787ccd2f4bcb7934"
  },
  {
    "url": "img/2/item-memme.png",
    "revision": "74d3707925a08b2d72aff61062a3221e"
  },
  {
    "url": "img/2/item-mermaidbow.png",
    "revision": "54f71578d10a261281b14b1d09eed690"
  },
  {
    "url": "img/2/item-mineral.png",
    "revision": "b92d1008406a3c2310678210fb93ff2f"
  },
  {
    "url": "img/2/item-miniseadragonarmor.png",
    "revision": "566826282bd35318c1e03111fe6e6b1b"
  },
  {
    "url": "img/2/item-morningstar.png",
    "revision": "26a428f4ecf9c4b5d385b2ab9832169c"
  },
  {
    "url": "img/2/item-mountforestdragon.png",
    "revision": "60880bddaf4cb748e3e0e71069999132"
  },
  {
    "url": "img/2/item-mountseadragon.png",
    "revision": "60880bddaf4cb748e3e0e71069999132"
  },
  {
    "url": "img/2/item-mountwhitetiger.png",
    "revision": "60880bddaf4cb748e3e0e71069999132"
  },
  {
    "url": "img/2/item-ninjaarmor.png",
    "revision": "1b572fd0db910d56d26825c968b09114"
  },
  {
    "url": "img/2/item-null.png",
    "revision": "4c4bcfba3a704554498c394b854be70f"
  },
  {
    "url": "img/2/item-orange.png",
    "revision": "1998fc2999faaaec936799108d7e4f56"
  },
  {
    "url": "img/2/item-paewoldo.png",
    "revision": "1339117cc45797f509514f83d8643f8e"
  },
  {
    "url": "img/2/item-paladinarmor.png",
    "revision": "0da781038d652c4415d3db3c0b31b8b1"
  },
  {
    "url": "img/2/item-pearlpendant.png",
    "revision": "dcd5c9bf34e0033a8c80ee593489f378"
  },
  {
    "url": "img/2/item-pearlring.png",
    "revision": "932657245c1558c1b2a3d4aeff88f7b1"
  },
  {
    "url": "img/2/item-pendant1.png",
    "revision": "4748339ab228f693d32c6f238d89287f"
  },
  {
    "url": "img/2/item-pickle.png",
    "revision": "3c6145f2334e40fbdb69e6e9793de61a"
  },
  {
    "url": "img/2/item-pinkcockroacharmor.png",
    "revision": "9683d35cf35180a7630b22a367142536"
  },
  {
    "url": "img/2/item-pinksword.png",
    "revision": "02cc5f79519c0bcea36a3bdd0b0a2349"
  },
  {
    "url": "img/2/item-piratearcherarmor.png",
    "revision": "a00d2169fd6ec1a593c90110d68a136e"
  },
  {
    "url": "img/2/item-pirateking.png",
    "revision": "8dbce9306dcc747f4a63243f8bf5315a"
  },
  {
    "url": "img/2/item-plasticbow.png",
    "revision": "5b9146c15cbbd25857889395ab1c8216"
  },
  {
    "url": "img/2/item-platearcherarmor.png",
    "revision": "3c9d1ee34560d498f13d40dda3819f04"
  },
  {
    "url": "img/2/item-platearmor.png",
    "revision": "fd4952eb42cbb8054189b1af34189415"
  },
  {
    "url": "img/2/item-plunger.png",
    "revision": "f5da61d599506222e00219ccabfb63d2"
  },
  {
    "url": "img/2/item-portalarmor.png",
    "revision": "e48f816bfc620094132b2f22ef8523a6"
  },
  {
    "url": "img/2/item-powerarmour.png",
    "revision": "d741262dd7b6e79532fac530cc725ac0"
  },
  {
    "url": "img/2/item-powersword.png",
    "revision": "544e5d5df228cb0e5a77be0450ae07d8"
  },
  {
    "url": "img/2/item-purplecloudkallege.png",
    "revision": "110b04e4b91a487cc595a9046e2faf50"
  },
  {
    "url": "img/2/item-rabbitarmor.png",
    "revision": "94d45f24b6159d1e36baa8cfc8d1fbe4"
  },
  {
    "url": "img/2/item-radisharmor.png",
    "revision": "82d795ff1f6a0349a596cdf8d28c1c72"
  },
  {
    "url": "img/2/item-rainbowapro.png",
    "revision": "0dd8750ed578128bbf9add20ea216f30"
  },
  {
    "url": "img/2/item-rainbowsword.png",
    "revision": "0899ceae9009da7542826abb716683bf"
  },
  {
    "url": "img/2/item-ratarcherarmor.png",
    "revision": "614dba6744617eecfc32e2a2016c3ea4"
  },
  {
    "url": "img/2/item-ratarmor.png",
    "revision": "b489b00d5d817161148b90e74a2c0582"
  },
  {
    "url": "img/2/item-redarcherarmor.png",
    "revision": "990208853ec3be4016b2fed3befe258c"
  },
  {
    "url": "img/2/item-redarmor.png",
    "revision": "b811fe57e0d021f542d332415a53323c"
  },
  {
    "url": "img/2/item-redbow.png",
    "revision": "2996eb96e5f51ec6e4c9ede497e3be52"
  },
  {
    "url": "img/2/item-reddamboarmor.png",
    "revision": "db49fe1f0f7a468b93ee5290f349aba5"
  },
  {
    "url": "img/2/item-redenelbow.png",
    "revision": "dda2dfa7ba4b81518bf184322e35961d"
  },
  {
    "url": "img/2/item-redguardarcherarmor.png",
    "revision": "7f4226827e7315d1ddf2b80601c1c2cb"
  },
  {
    "url": "img/2/item-redguardarmor.png",
    "revision": "09d22e003a97b0db0219206808c5589a"
  },
  {
    "url": "img/2/item-redlightbow.png",
    "revision": "977baf504dfbc6625da1b9d023f4f1d9"
  },
  {
    "url": "img/2/item-redlightsaber.png",
    "revision": "b48ef2df1229ca48c7c55a181f4b03d9"
  },
  {
    "url": "img/2/item-redmetalbow.png",
    "revision": "ee82d9f3a6e15ce0b9f7b3674aaf0281"
  },
  {
    "url": "img/2/item-redmetalsword.png",
    "revision": "6b19023c99d84a76b858028696d4d3b0"
  },
  {
    "url": "img/2/item-redsickle.png",
    "revision": "9cb2a758fb8484e0e05b1f060caaf12a"
  },
  {
    "url": "img/2/item-redsicklebow.png",
    "revision": "78b73cace29d69f84bdbf5e8455d1fcc"
  },
  {
    "url": "img/2/item-redsword.png",
    "revision": "947394f4b3e4c3aab32b037d0fa2fd9d"
  },
  {
    "url": "img/2/item-redwingarcherarmor.png",
    "revision": "cc43adc380780fa78e89cbc6bc5ec554"
  },
  {
    "url": "img/2/item-redwingarmor.png",
    "revision": "10327ddca5247b701b40193eb4f09bf4"
  },
  {
    "url": "img/2/item-regionarmor.png",
    "revision": "0d046ec40cab9b05e6946736d0bc52c2"
  },
  {
    "url": "img/2/item-ring1.png",
    "revision": "be3456538a2a1e9d4887824e1d9004ad"
  },
  {
    "url": "img/2/item-robocoparmor.png",
    "revision": "f2ad3d424864b32cbafd9ee745d059a4"
  },
  {
    "url": "img/2/item-rock.png",
    "revision": "729f61e43d67f38a0eaecdc88edfdf96"
  },
  {
    "url": "img/2/item-rose.png",
    "revision": "1bdb71af32465da1f589a381b5f9fbb4"
  },
  {
    "url": "img/2/item-rosebow.png",
    "revision": "6f8c9ca68fda6efcc529c89b30aedbdc"
  },
  {
    "url": "img/2/item-royalazalea.png",
    "revision": "b63947b6ba9cb38c604e5ca16432ccbb"
  },
  {
    "url": "img/2/item-rubyring.png",
    "revision": "0319eb3e96bd500c5e384c118da50f32"
  },
  {
    "url": "img/2/item-rudolfarmor.png",
    "revision": "563b96a63056b8245dbd2dc68463ce7e"
  },
  {
    "url": "img/2/item-sapphirering.png",
    "revision": "55a01ac61266ac24a298d8927df70d1b"
  },
  {
    "url": "img/2/item-schooluniform.png",
    "revision": "ecfcbc03ba6838b31232d56d08e4c5b3"
  },
  {
    "url": "img/2/item-scimitar.png",
    "revision": "2cc6133555f87ca15e4e5825916238b2"
  },
  {
    "url": "img/2/item-seadragonarmor.png",
    "revision": "94e8e19399e4d45e5a284f473df1542a"
  },
  {
    "url": "img/2/item-seahorsebow.png",
    "revision": "e3cae0233036e4394d4042d56cc9077c"
  },
  {
    "url": "img/2/item-searage.png",
    "revision": "41686029bd030f0c598819cbd277057e"
  },
  {
    "url": "img/2/item-seed.png",
    "revision": "7d4b99c13b4a5cb34ff15c314678b577"
  },
  {
    "url": "img/2/item-shadowregionarmor.png",
    "revision": "b7869606f678d7e25c76d8e0b71e45b6"
  },
  {
    "url": "img/2/item-shardt1.png",
    "revision": "fdf96c5d9ed63ff1de97189c434f0f35"
  },
  {
    "url": "img/2/item-shardt2.png",
    "revision": "579d2cb67a43dec042f7eb09176fb59a"
  },
  {
    "url": "img/2/item-shardt3.png",
    "revision": "91d386ff399ef21bb7bd49ce917faee6"
  },
  {
    "url": "img/2/item-shardt4.png",
    "revision": "60cb9404812180c30a484a17a277ad77"
  },
  {
    "url": "img/2/item-shardt5.png",
    "revision": "066b1db34b3a2bbf7c50a546329ed761"
  },
  {
    "url": "img/2/item-sickle.png",
    "revision": "419f0bd4d52431834bada378f93f26bf"
  },
  {
    "url": "img/2/item-sicklebow.png",
    "revision": "129a293239a07737e2a180bc4f6a1bce"
  },
  {
    "url": "img/2/item-sidesword.png",
    "revision": "619fdc7a59a77fab7aca7e5091619fe2"
  },
  {
    "url": "img/2/item-skylightbow.png",
    "revision": "f546a244e7c21a8f5937ac976326588d"
  },
  {
    "url": "img/2/item-skylightsaber.png",
    "revision": "601351595248fc83b2b292eae0590cdf"
  },
  {
    "url": "img/2/item-snowfoxarcherarmor.png",
    "revision": "9e29709e8d889fbbdac8777e178f47ba"
  },
  {
    "url": "img/2/item-snowfoxarmor.png",
    "revision": "45005b252b520d300dc18762504da821"
  },
  {
    "url": "img/2/item-snowmanarmor.png",
    "revision": "c68623f779d64c378ecc951c0cbb0393"
  },
  {
    "url": "img/2/item-snowpotion.png",
    "revision": "b8d214f2fea7cfe253cf5188de7971d1"
  },
  {
    "url": "img/2/item-spear.png",
    "revision": "c928e7fe0e373cc7a2a57d96ee707432"
  },
  {
    "url": "img/2/item-spiritring.png",
    "revision": "c3f2e13aa2ec078c36ea1e78668d7336"
  },
  {
    "url": "img/2/item-sproutring.png",
    "revision": "ffac119291c9b27630c70d15654fd1ed"
  },
  {
    "url": "img/2/item-squeakyhammer.png",
    "revision": "fab30b01fcb0301db95fdb8e15983c0e"
  },
  {
    "url": "img/2/item-squidarmor.png",
    "revision": "68e9b2b30c1667fd196da0596645e4db"
  },
  {
    "url": "img/2/item-sword1.png",
    "revision": "d07cb8b84ef8a367388f7e5630e0f4ef"
  },
  {
    "url": "img/2/item-sword2.png",
    "revision": "604020ec6119150cda7e0cfe8e4f8e06"
  },
  {
    "url": "img/2/item-taekwondo.png",
    "revision": "ad0fb0268bdb65021da46b4ab5a75e6b"
  },
  {
    "url": "img/2/item-tamagotchiring.png",
    "revision": "f429074e8746063d7575c70f6d52a347"
  },
  {
    "url": "img/2/item-thiefarmor.png",
    "revision": "0398596712564c000346e6d56a867728"
  },
  {
    "url": "img/2/item-tigerarmor.png",
    "revision": "6a5e7fb9eee009f4febd90a8a4365d8d"
  },
  {
    "url": "img/2/item-topazring.png",
    "revision": "fa1e91d7682142d66e2e0ecde3801364"
  },
  {
    "url": "img/2/item-trident.png",
    "revision": "1a9530934802b576440b3d0bcd77f67c"
  },
  {
    "url": "img/2/item-typhoon.png",
    "revision": "752a25bdcd2d4ec5dd3a441335507b5c"
  },
  {
    "url": "img/2/item-violetbow.png",
    "revision": "d3e7d62ff338220bba8c92ca65ce0f52"
  },
  {
    "url": "img/2/item-watermelon.png",
    "revision": "ae5a13e17c143efdeb6b0885efcd1e48"
  },
  {
    "url": "img/2/item-watermelonbow.png",
    "revision": "b0514b1846f855f0692231e6cc443803"
  },
  {
    "url": "img/2/item-weaponblade.png",
    "revision": "ce80a8bbffda2fbc7430205db68da152"
  },
  {
    "url": "img/2/item-weaponcommon.png",
    "revision": "8fa11f37ed9ca8bcb962822074a1007c"
  },
  {
    "url": "img/2/item-weaponhilt.png",
    "revision": "0ec9631a48deda8a2a7f37948d587cf0"
  },
  {
    "url": "img/2/item-weaponrare.png",
    "revision": "b59fa86c6fae6c1c1b4dd2aa579e313e"
  },
  {
    "url": "img/2/item-weaponuncommon.png",
    "revision": "a230edb91aadd46db3847f08567a5feb"
  },
  {
    "url": "img/2/item-weastaff.png",
    "revision": "1eb9976ffb447be2710b6afde6598052"
  },
  {
    "url": "img/2/item-whip.png",
    "revision": "b6646c3bfb8559b180203320d4fef83a"
  },
  {
    "url": "img/2/item-whitearcherarmor.png",
    "revision": "3fdc62bb0ea6ec2cb5f5e8c2074e5e24"
  },
  {
    "url": "img/2/item-whitearmor.png",
    "revision": "234b37fb03a294639c365eac083dfa2b"
  },
  {
    "url": "img/2/item-wizardrobe.png",
    "revision": "16afc0c2718eaba9fba4232b53455e5c"
  },
  {
    "url": "img/2/item-wolfarcherarmor.png",
    "revision": "dde4cb27f9c9c0ec50b650c3d8f78306"
  },
  {
    "url": "img/2/item-wolfarmor.png",
    "revision": "dbc18f7d23002d2dd80f6d7a05e44abe"
  },
  {
    "url": "img/2/item-wood.png",
    "revision": "15cd423787dcaaeda0c6d38577a466ef"
  },
  {
    "url": "img/2/item-woodenbow.png",
    "revision": "321acad4bbcbb036a136362d547d96c3"
  },
  {
    "url": "img/2/main.png",
    "revision": "9a260288d5e8289c250c472958c4a7b8"
  },
  {
    "url": "img/2/maintwo.png",
    "revision": "7462eeb2338c761608ed844472a054ac"
  },
  {
    "url": "img/2/mapframe.png",
    "revision": "16d6da2eca3b832d90fa20f1cf2d5e5c"
  },
  {
    "url": "img/2/mapicons.png",
    "revision": "fad477fca7adc7c619e70289a647471d"
  },
  {
    "url": "img/2/pointer.png",
    "revision": "df0a4bedf4d0fc64d094c83026e994df"
  },
  {
    "url": "img/2/skillicons.png",
    "revision": "900c974031e03ee2d52c0d47a43f9aa5"
  },
  {
    "url": "img/2/skillslots.png",
    "revision": "d8f5cab4375e9ca8804b5103e66f50eb"
  },
  {
    "url": "img/2/spritesheet.png",
    "revision": "848179d366a3a5771f45401b0672a06a"
  },
  {
    "url": "img/2/trade.png",
    "revision": "052744cb17b4badddca1a2b8bf025dfb"
  },
  {
    "url": "img/3/bank.png",
    "revision": "6b73df5400dedde85fdb724314a8be9c"
  },
  {
    "url": "img/3/border.png",
    "revision": "b9ed8118745ce2bd1d3cc58c8e95e2eb"
  },
  {
    "url": "img/3/buttons.png",
    "revision": "434a452f002e724e17913acb382fb921"
  },
  {
    "url": "img/3/characterdialogsheet.png",
    "revision": "52d796e6b9645ffdabcb4c67478653b8"
  },
  {
    "url": "img/3/containers.png",
    "revision": "6296eb87aa6ecdca14c8630427f9adf8"
  },
  {
    "url": "img/3/item-adhererarcherarmor.png",
    "revision": "c698165bdf919ddad5d5517c581de8a1"
  },
  {
    "url": "img/3/item-adhererrobe.png",
    "revision": "f609cdb6fce240d6014221dace5cee8d"
  },
  {
    "url": "img/3/item-adminarmor.png",
    "revision": "77dcd2470ad42311fd28b2afca43971e"
  },
  {
    "url": "img/3/item-apple.png",
    "revision": "09adfec20481471431f275870c0aaa62"
  },
  {
    "url": "img/3/item-archerarmor.png",
    "revision": "a1c7df7ac713c14ba20b13b68caa3e08"
  },
  {
    "url": "img/3/item-archerschooluniform.png",
    "revision": "a05502ae5f7b6afe2f27035ddc13706c"
  },
  {
    "url": "img/3/item-armorbinding.png",
    "revision": "81755b5e8faf30c9588931ba1ed60339"
  },
  {
    "url": "img/3/item-armorcommon.png",
    "revision": "83acf99ac7fd05b6a036b847710223b4"
  },
  {
    "url": "img/3/item-armorpatches.png",
    "revision": "18a9b0dfd9f53a13b7bcd50d361527ca"
  },
  {
    "url": "img/3/item-armorrare.png",
    "revision": "6c5d505df3690f47838f79d40933440d"
  },
  {
    "url": "img/3/item-armoruncommon.png",
    "revision": "a8f0d0412673230c556d5cb8b40947b3"
  },
  {
    "url": "img/3/item-axe.png",
    "revision": "b89282ae7c2519029eb533e63a1330be"
  },
  {
    "url": "img/3/item-bamboospear.png",
    "revision": "9689f4700ca3d8d1ae4f9f78a4cbf092"
  },
  {
    "url": "img/3/item-banana.png",
    "revision": "01d63885be49ca90a811c975736225d6"
  },
  {
    "url": "img/3/item-bastardsword.png",
    "revision": "30d22de6eb2276717679fa66ff184d6b"
  },
  {
    "url": "img/3/item-bearseonbiarmor.png",
    "revision": "be243e117915078c07a0cd511c3802ed"
  },
  {
    "url": "img/3/item-beautifullife.png",
    "revision": "c3507254813fbe321e8f164b91f5255c"
  },
  {
    "url": "img/3/item-beearmor.png",
    "revision": "315c193e4178e5b763dc3eee7caf2beb"
  },
  {
    "url": "img/3/item-beetlearmor.png",
    "revision": "805d2bc1a961dd511c7c460a0c06b6dc"
  },
  {
    "url": "img/3/item-bigflask.png",
    "revision": "7140743698109770b69b49ec272ba880"
  },
  {
    "url": "img/3/item-blackpotion.png",
    "revision": "8ff5a5a42dad5e93afbae295f38a0a44"
  },
  {
    "url": "img/3/item-blackspiderarmor.png",
    "revision": "7ebd65aaaee1ba86bc1e99ac2941cdfc"
  },
  {
    "url": "img/3/item-bloodbow.png",
    "revision": "6e76ea9c00149659625fd030c1a0b6be"
  },
  {
    "url": "img/3/item-bluedamboarmor.png",
    "revision": "779a6910b7f1dc89c5dfb6b63907386c"
  },
  {
    "url": "img/3/item-bluepiratearmor.png",
    "revision": "b4181a1e7f5fde2202327e55b65c053b"
  },
  {
    "url": "img/3/item-bluescimitar.png",
    "revision": "606acec45db7211a43bda1b21b34e707"
  },
  {
    "url": "img/3/item-bluesword.png",
    "revision": "ea8958f24043ae733e481f9f7106b515"
  },
  {
    "url": "img/3/item-bluewingarcherarmor.png",
    "revision": "a9cb7e78b2d8592fc63cff83b567955c"
  },
  {
    "url": "img/3/item-bluewingarmor.png",
    "revision": "5777dce3ef090c27fdf5f2ea7d018271"
  },
  {
    "url": "img/3/item-book.png",
    "revision": "9c83b21e69af2f3b7db2c6f65abf5e0d"
  },
  {
    "url": "img/3/item-bowcommon.png",
    "revision": "c6f4ad56eeedf4a6bbf50db6ab5ca913"
  },
  {
    "url": "img/3/item-bowlimb.png",
    "revision": "09e5468c81a5b04ad0b50a4209509990"
  },
  {
    "url": "img/3/item-bowrare.png",
    "revision": "64d829fc356307dc3c3aa6fdcc1cb421"
  },
  {
    "url": "img/3/item-bowstring.png",
    "revision": "bd1a57c45eb4cd842212cf1d9fd9c9c4"
  },
  {
    "url": "img/3/item-bowuncommon.png",
    "revision": "bdba994cb51969f6a11c44b606b3008f"
  },
  {
    "url": "img/3/item-branch.png",
    "revision": "dfb8b5b3bae8b3f31db6093e3d17e120"
  },
  {
    "url": "img/3/item-breaker.png",
    "revision": "a9b2723a24f7733f7d1e342d4bef5771"
  },
  {
    "url": "img/3/item-bridalmask.png",
    "revision": "6e5e29296663d4952375869726001ce9"
  },
  {
    "url": "img/3/item-burger.png",
    "revision": "b542015b364932476c0b0090cc85dba1"
  },
  {
    "url": "img/3/item-burgerarmor.png",
    "revision": "888095ba660511976d7377cb878128e7"
  },
  {
    "url": "img/3/item-butcherknife.png",
    "revision": "293f1e4ee34f8c30d3d8104d17462b8d"
  },
  {
    "url": "img/3/item-cactusaxe.png",
    "revision": "75dca869f27bd7bec1194fac10b5abcc"
  },
  {
    "url": "img/3/item-cake.png",
    "revision": "e140f97397920798eea2b0b0abd73dba"
  },
  {
    "url": "img/3/item-candybar.png",
    "revision": "ad7db0eeaecaf63f3cce47f28369d2fe"
  },
  {
    "url": "img/3/item-captainbow.png",
    "revision": "d601c6c624609c06df8c4f52e255d2b4"
  },
  {
    "url": "img/3/item-catarmor.png",
    "revision": "b116452c335b84875a66e6587e6f6b5c"
  },
  {
    "url": "img/3/item-cd.png",
    "revision": "9e077a714fb7761e925c34503f8fa75d"
  },
  {
    "url": "img/3/item-cheoliarcherarmor.png",
    "revision": "b84f7477f5c85a39352fc55de21b5967"
  },
  {
    "url": "img/3/item-cheoliarmor.png",
    "revision": "8954cacb39ae76a49cc55c743e59587f"
  },
  {
    "url": "img/3/item-christmasarmor.png",
    "revision": "7f2f09595222d2a78cf53ddc1ed10c50"
  },
  {
    "url": "img/3/item-cloth.png",
    "revision": "85363764953cbe85e31e4f1ee1523579"
  },
  {
    "url": "img/3/item-clotharmor.png",
    "revision": "46237b6c9dffc195ce0e528f8f27ccee"
  },
  {
    "url": "img/3/item-cockroachsuit.png",
    "revision": "8333e2bfc63d5523ebb65252b95ce567"
  },
  {
    "url": "img/3/item-cokearmor.png",
    "revision": "96d117ba02cc3a5397f61efbd718a6eb"
  },
  {
    "url": "img/3/item-comb.png",
    "revision": "c0bd5859b945d31db8e30d069cd06ed4"
  },
  {
    "url": "img/3/item-combatuniform.png",
    "revision": "b8d8267ecbba4a207e91b44dddc7f6e5"
  },
  {
    "url": "img/3/item-conferencecall.png",
    "revision": "fce8042beb09e0ea5baece69e70d2b16"
  },
  {
    "url": "img/3/item-crystalarcherarmor.png",
    "revision": "a03f27278f285ecfd309fb57473c81fe"
  },
  {
    "url": "img/3/item-crystalarmor.png",
    "revision": "b47e147e097629d2cfda5cd34c385571"
  },
  {
    "url": "img/3/item-crystalbow.png",
    "revision": "6f022a2ef559e903b157274510dae5c6"
  },
  {
    "url": "img/3/item-damboarmor.png",
    "revision": "7e14a4e3bb6e16f4cc8526ee439494da"
  },
  {
    "url": "img/3/item-daywalker.png",
    "revision": "7a1c144e119ef4cf4507fed7e5bc81e8"
  },
  {
    "url": "img/3/item-deathbow.png",
    "revision": "2cd75a844838b63a3b814cd1043d71d3"
  },
  {
    "url": "img/3/item-devilkazyaarmor.png",
    "revision": "061458c542d9cc0675bb10e06cfc731b"
  },
  {
    "url": "img/3/item-devilkazyasword.png",
    "revision": "cbc1e67922b22e2ebfa49451f046bdaf"
  },
  {
    "url": "img/3/item-diamondring.png",
    "revision": "d0ff3a2c06c7d74a4f264bd5d6983ed1"
  },
  {
    "url": "img/3/item-dinosaurarmor.png",
    "revision": "c3cd5195f01968a9584b6554a1d4ee74"
  },
  {
    "url": "img/3/item-dolring.png",
    "revision": "782e9ada9ac61268ace5f645e0b21c10"
  },
  {
    "url": "img/3/item-dovakinarcherarmor.png",
    "revision": "7021903e67841592d3bf607ec758e9ad"
  },
  {
    "url": "img/3/item-dovakinarmor.png",
    "revision": "36dd2fed1d5a155bd913b25d1635c2c4"
  },
  {
    "url": "img/3/item-dragonarmor.png",
    "revision": "26e0a7a97a02daec7b831c49a970a6af"
  },
  {
    "url": "img/3/item-element.png",
    "revision": "ce532b9acbe61620cb96d79cc4333e35"
  },
  {
    "url": "img/3/item-emeraldring.png",
    "revision": "38f5fcad358c10b29bde9a24f586799c"
  },
  {
    "url": "img/3/item-enelarmor.png",
    "revision": "4166ae9505a9645434f6e4d3fbb72ad2"
  },
  {
    "url": "img/3/item-eneltrident.png",
    "revision": "4e91910305451e41cdad22162203d1fc"
  },
  {
    "url": "img/3/item-essentialrage.png",
    "revision": "a1f12f076641b8ff1d2370e773b03dc7"
  },
  {
    "url": "img/3/item-evilarmor.png",
    "revision": "83b9098af5f68312337c84c2a927b14d"
  },
  {
    "url": "img/3/item-fallenarcherarmor.png",
    "revision": "37300d4b312e8ee68efd8df0efd539e4"
  },
  {
    "url": "img/3/item-fallenarmor.png",
    "revision": "6707ae74b94bd84aa99234fa47bb5dc8"
  },
  {
    "url": "img/3/item-fireplay.png",
    "revision": "9a7899b379fb4ea321101861ebd7d362"
  },
  {
    "url": "img/3/item-firepotion.png",
    "revision": "83b95ad575145c68553719bdb1884697"
  },
  {
    "url": "img/3/item-fireshot.png",
    "revision": "2ad22e22142d505502ae4069b607a6c3"
  },
  {
    "url": "img/3/item-firesword.png",
    "revision": "306e9dc9474e34ea58e0b77391abea34"
  },
  {
    "url": "img/3/item-flask.png",
    "revision": "ff98578aca29dc2832bf90f1cc837225"
  },
  {
    "url": "img/3/item-forestbow.png",
    "revision": "a0be0873cd2e96e7cbffe74e48beda96"
  },
  {
    "url": "img/3/item-forestguardiansword.png",
    "revision": "55c2b1fc9ff2f82eb2ae3a355a21c2f5"
  },
  {
    "url": "img/3/item-frankensteinarmor.png",
    "revision": "4b7849d1cab25c5c66c214529bfa34fd"
  },
  {
    "url": "img/3/item-friedpotatoarmor.png",
    "revision": "9444ece673c83c89012f0f84ae94c880"
  },
  {
    "url": "img/3/item-frogarmor.png",
    "revision": "7732a28f487ced8515ea5b73f7efde3d"
  },
  {
    "url": "img/3/item-frostarmor.png",
    "revision": "bba1e405d858a2f07d4ae6693cd4af99"
  },
  {
    "url": "img/3/item-gayarcherarmor.png",
    "revision": "66e5267713a346608637ed016c1bacdf"
  },
  {
    "url": "img/3/item-gayarmor.png",
    "revision": "6b6f5c0abb9e17721a39ce8bc9e85177"
  },
  {
    "url": "img/3/item-gaybow.png",
    "revision": "4ebe6a5496468a740581c17fcb6653ef"
  },
  {
    "url": "img/3/item-gbwingarcherarmor.png",
    "revision": "be20e0d33ac785e63c86108f7c134e94"
  },
  {
    "url": "img/3/item-gbwingarmor.png",
    "revision": "51a15ec3c37088b4d6df53018e105e13"
  },
  {
    "url": "img/3/item-ghostrider.png",
    "revision": "535e7a8a1ca43fa34ffd2a845c3c4188"
  },
  {
    "url": "img/3/item-gold.png",
    "revision": "20949d9afae17d8eb1add540e69d07a1"
  },
  {
    "url": "img/3/item-goldaxe.png",
    "revision": "1139cecc68ec95be981e998d5f2967a3"
  },
  {
    "url": "img/3/item-goldenarcherarmor.png",
    "revision": "3433638b498e9d4af2aa345ae3088fd2"
  },
  {
    "url": "img/3/item-goldenarmor.png",
    "revision": "e480e9e775fd39499f040a2ed6c71176"
  },
  {
    "url": "img/3/item-goldenbow.png",
    "revision": "e9a96c238820686e5f1b31fd000d2986"
  },
  {
    "url": "img/3/item-goldensword.png",
    "revision": "1889bcbc7ccdbc99b7f677e2504e4a94"
  },
  {
    "url": "img/3/item-goldring.png",
    "revision": "36235b00a9291184f2148506a9f03894"
  },
  {
    "url": "img/3/item-greenarcherarmor.png",
    "revision": "cf37a2b489b0fe2a89dbacd8b3841f43"
  },
  {
    "url": "img/3/item-greenarmor.png",
    "revision": "35d6f2771077d24e27694773a246b33c"
  },
  {
    "url": "img/3/item-greenbow.png",
    "revision": "3cc330f165674c00f81f5e9478cc1754"
  },
  {
    "url": "img/3/item-greendamboarmor.png",
    "revision": "28e6884879b96c15901845707b881f67"
  },
  {
    "url": "img/3/item-greenlightbow.png",
    "revision": "125540206b9cd041f176ac251051f3cc"
  },
  {
    "url": "img/3/item-greenlightsaber.png",
    "revision": "45951d6afcede839e6ef319a6adbdde9"
  },
  {
    "url": "img/3/item-greenpendant.png",
    "revision": "b663fec5192a936485e48fc6816c0835"
  },
  {
    "url": "img/3/item-greenwingarcherarmor.png",
    "revision": "92e48868f8e99ab34db6fde396be0785"
  },
  {
    "url": "img/3/item-greenwingarmor.png",
    "revision": "433b5eb9a5cdb788e57e02e805e8b18a"
  },
  {
    "url": "img/3/item-guardarcherarmor.png",
    "revision": "a97dfc2ad0bf3acb638faeb63ae0bd32"
  },
  {
    "url": "img/3/item-guardarmor.png",
    "revision": "2e07d3f85e316080c29b4d73d2c632c7"
  },
  {
    "url": "img/3/item-halberd.png",
    "revision": "8471a80a46fa8f9523916924a13f8dd6"
  },
  {
    "url": "img/3/item-halloweenjkarmor.png",
    "revision": "27a3ff49a5da3be7e1fe7cb0d7654532"
  },
  {
    "url": "img/3/item-hammer.png",
    "revision": "51773f363837be455190f21044ee80c5"
  },
  {
    "url": "img/3/item-hongcheolarmor.png",
    "revision": "10724ced07db78851afe484355f650ae"
  },
  {
    "url": "img/3/item-huniarmor.png",
    "revision": "f907a42ace55f79f83e5a83d7e0611af"
  },
  {
    "url": "img/3/item-hunterbow.png",
    "revision": "33f71433f3739809d22b08cbb5bec7af"
  },
  {
    "url": "img/3/item-icerose.png",
    "revision": "f74a281ee31d6f6064f3a2ab525f0e9f"
  },
  {
    "url": "img/3/item-ironbow.png",
    "revision": "3c73b3cb83d84b652eb1e3975cfda4b1"
  },
  {
    "url": "img/3/item-ironknightarmor.png",
    "revision": "a09a4c2e1c9a3bed0f9cfd9d4dff5827"
  },
  {
    "url": "img/3/item-justicebow.png",
    "revision": "90e1fca2160f4ea22cae660c79c379a4"
  },
  {
    "url": "img/3/item-justicehammer.png",
    "revision": "b06ff743502aeec1248eb2551313987b"
  },
  {
    "url": "img/3/item-leaf.png",
    "revision": "354e1babf3e5ed515246d8f303b5fc2e"
  },
  {
    "url": "img/3/item-leatherarcherarmor.png",
    "revision": "c5a92af298accd6eed4f6978dd7c5025"
  },
  {
    "url": "img/3/item-leatherarmor.png",
    "revision": "d3fef43fdbe40d3b07eebde10ac37a07"
  },
  {
    "url": "img/3/item-legolasarmor.png",
    "revision": "e8a2fd7f172345d441bb5385233d143a"
  },
  {
    "url": "img/3/item-loveactring.png",
    "revision": "1887fe7eded1e613eab2eee878ca6117"
  },
  {
    "url": "img/3/item-machete.png",
    "revision": "5597382c8a5f3729f4a0c467e63459f0"
  },
  {
    "url": "img/3/item-magicspear.png",
    "revision": "8a3b25655d4ab98157f1bf829eeab1cf"
  },
  {
    "url": "img/3/item-mailarcherarmor.png",
    "revision": "1bf9533a060363197dd78922eaee5433"
  },
  {
    "url": "img/3/item-mailarmor.png",
    "revision": "496faab0ed0482dd95d53c0b1fc4385f"
  },
  {
    "url": "img/3/item-manaflask.png",
    "revision": "382ae8a6eaa9450924fdc1736dedbc07"
  },
  {
    "url": "img/3/item-marblependant.png",
    "revision": "194c8ebafec665570b613e4f528a45cd"
  },
  {
    "url": "img/3/item-marinebow.png",
    "revision": "927f7c4cf6f8c8dc6d9947b7950e13cb"
  },
  {
    "url": "img/3/item-memme.png",
    "revision": "dc34f6f5006c86055cd5513d26a3391a"
  },
  {
    "url": "img/3/item-mermaidbow.png",
    "revision": "bf10d4b37fe3d1c8c2739ab9252583c2"
  },
  {
    "url": "img/3/item-mineral.png",
    "revision": "7b75dbde25c7f2d665e196e445ce7d66"
  },
  {
    "url": "img/3/item-miniseadragonarmor.png",
    "revision": "af955dfe37be51059be165fa9201e50c"
  },
  {
    "url": "img/3/item-morningstar.png",
    "revision": "5597382c8a5f3729f4a0c467e63459f0"
  },
  {
    "url": "img/3/item-mountforestdragon.png",
    "revision": "ff98578aca29dc2832bf90f1cc837225"
  },
  {
    "url": "img/3/item-mountseadragon.png",
    "revision": "ff98578aca29dc2832bf90f1cc837225"
  },
  {
    "url": "img/3/item-mountwhitetiger.png",
    "revision": "ff98578aca29dc2832bf90f1cc837225"
  },
  {
    "url": "img/3/item-ninjaarmor.png",
    "revision": "d36798351f985d598ab636ca1b317530"
  },
  {
    "url": "img/3/item-null.png",
    "revision": "d5f771f0dec70b4a3715821f44116d2f"
  },
  {
    "url": "img/3/item-orange.png",
    "revision": "936a030f195be55099f2e171f3e0323f"
  },
  {
    "url": "img/3/item-paewoldo.png",
    "revision": "c8a0c517062903f5f00017c85d59ade2"
  },
  {
    "url": "img/3/item-paladinarmor.png",
    "revision": "bd79a870c032bc1695db6bfdd059bd73"
  },
  {
    "url": "img/3/item-pearlpendant.png",
    "revision": "385c2c42dbea33a86e2da2a90b31b412"
  },
  {
    "url": "img/3/item-pearlring.png",
    "revision": "febe3bf407f368a1f0a84a4f4b4a583b"
  },
  {
    "url": "img/3/item-pendant1.png",
    "revision": "13f3b1baefb7a3c5b1c1cfec9d0573c9"
  },
  {
    "url": "img/3/item-pickle.png",
    "revision": "960271886ea07484c502373eb5e70111"
  },
  {
    "url": "img/3/item-pinkcockroacharmor.png",
    "revision": "f993b8dc7a4ed71cf15c8eaf8dd9cc7a"
  },
  {
    "url": "img/3/item-pinksword.png",
    "revision": "0931b4cf870bcb5b400195ef22a68fac"
  },
  {
    "url": "img/3/item-piratearcherarmor.png",
    "revision": "3da5ea6ba2ebc759fb376f852e60c8b8"
  },
  {
    "url": "img/3/item-pirateking.png",
    "revision": "10bd13d3e91e8af2e2e7c788bb29f291"
  },
  {
    "url": "img/3/item-plasticbow.png",
    "revision": "222295235464ffcfa7cebcb57412aa7c"
  },
  {
    "url": "img/3/item-platearcherarmor.png",
    "revision": "fe5214cd4903c43c6413eb59f3fae52e"
  },
  {
    "url": "img/3/item-platearmor.png",
    "revision": "6e55b0ddabe4cec62c149f1c2888bb5e"
  },
  {
    "url": "img/3/item-plunger.png",
    "revision": "a429d06925e53f16cc6492a83fe9e736"
  },
  {
    "url": "img/3/item-portalarmor.png",
    "revision": "0bbbf93c587b7da826da3dc095f794f5"
  },
  {
    "url": "img/3/item-powerarmour.png",
    "revision": "e480e9e775fd39499f040a2ed6c71176"
  },
  {
    "url": "img/3/item-powersword.png",
    "revision": "1889bcbc7ccdbc99b7f677e2504e4a94"
  },
  {
    "url": "img/3/item-purplecloudkallege.png",
    "revision": "1dcb635ff1cedd53f5afeaba709cca2e"
  },
  {
    "url": "img/3/item-rabbitarmor.png",
    "revision": "2dc0890497a8148d1ee2f093e3679db6"
  },
  {
    "url": "img/3/item-radisharmor.png",
    "revision": "c43aba7dc6fa5c36c3462ac6a527ebf7"
  },
  {
    "url": "img/3/item-rainbowapro.png",
    "revision": "f6a1d378776d9ad1f5dab7fcdb849050"
  },
  {
    "url": "img/3/item-rainbowsword.png",
    "revision": "8368669a85e495ab9d76f99414e7c1d7"
  },
  {
    "url": "img/3/item-ratarcherarmor.png",
    "revision": "b4ffd6df3c4573d57a6b2b944a852157"
  },
  {
    "url": "img/3/item-ratarmor.png",
    "revision": "df002d45a194f28718a4d9c6854bbd1f"
  },
  {
    "url": "img/3/item-redarcherarmor.png",
    "revision": "1f3074832f4a977d0663e0a49d78c063"
  },
  {
    "url": "img/3/item-redarmor.png",
    "revision": "d736cf794c16b7611359a4aa67ee9c69"
  },
  {
    "url": "img/3/item-redbow.png",
    "revision": "8039cb8c88fe7f04286db8eeb974de46"
  },
  {
    "url": "img/3/item-reddamboarmor.png",
    "revision": "13b8c6b99533d8e95392280da412ae11"
  },
  {
    "url": "img/3/item-redenelbow.png",
    "revision": "1ee146766bccb52db298581d25a39d04"
  },
  {
    "url": "img/3/item-redguardarcherarmor.png",
    "revision": "a595d6db95a7d8ece28b7a612cbae059"
  },
  {
    "url": "img/3/item-redguardarmor.png",
    "revision": "b561b9d14780b9d6c372ef534bf14e47"
  },
  {
    "url": "img/3/item-redlightbow.png",
    "revision": "25ca1c8da3091dd7caef8ed86770f7c8"
  },
  {
    "url": "img/3/item-redlightsaber.png",
    "revision": "5dd478b394b0200d072ab7204a2324ba"
  },
  {
    "url": "img/3/item-redmetalbow.png",
    "revision": "2f312616fe1ce7da15a63ced00af60c6"
  },
  {
    "url": "img/3/item-redmetalsword.png",
    "revision": "8bafbc8b99211bcfaf4f2f305cbe27a0"
  },
  {
    "url": "img/3/item-redsickle.png",
    "revision": "36a78698d418535778d5a2ff50932cd2"
  },
  {
    "url": "img/3/item-redsicklebow.png",
    "revision": "a7783291963cc16b5d0a47f63b112637"
  },
  {
    "url": "img/3/item-redsword.png",
    "revision": "08f05e5bff0f20ba6e24e41244a2ce8c"
  },
  {
    "url": "img/3/item-redwingarcherarmor.png",
    "revision": "bd5b2e64413f105fc24c9830d4eb56a1"
  },
  {
    "url": "img/3/item-redwingarmor.png",
    "revision": "d50acfd8ddccb1a61ff6b44563022d18"
  },
  {
    "url": "img/3/item-regionarmor.png",
    "revision": "5162d271cbfee7183f02e417aace08b5"
  },
  {
    "url": "img/3/item-ring1.png",
    "revision": "a16256568efaaf8a75dd92652c2342f7"
  },
  {
    "url": "img/3/item-robocoparmor.png",
    "revision": "38b1104eab566ff646eab3d2444b13e1"
  },
  {
    "url": "img/3/item-rock.png",
    "revision": "2a02079ed58ef2efd30859bd78225305"
  },
  {
    "url": "img/3/item-rose.png",
    "revision": "8d0b58fe4464762f5856f1ef4c35062e"
  },
  {
    "url": "img/3/item-rosebow.png",
    "revision": "fc953c832828a9257afaa7502532ef3d"
  },
  {
    "url": "img/3/item-royalazalea.png",
    "revision": "81841307c96c07a28deffcfe8dda2019"
  },
  {
    "url": "img/3/item-rubyring.png",
    "revision": "f79e12348e8bb7a90ef158905411d489"
  },
  {
    "url": "img/3/item-rudolfarmor.png",
    "revision": "048a0fe577744bed853ea1665ff2c1bc"
  },
  {
    "url": "img/3/item-sapphirering.png",
    "revision": "c15331595f01dc62336329b06faa9e94"
  },
  {
    "url": "img/3/item-schooluniform.png",
    "revision": "5cdbc4ec3610104994ef5f20bc913fa9"
  },
  {
    "url": "img/3/item-scimitar.png",
    "revision": "b005ca2ee145f89d74489466602dd044"
  },
  {
    "url": "img/3/item-seadragonarmor.png",
    "revision": "93fabd110307944ba94dca549d4d081b"
  },
  {
    "url": "img/3/item-seahorsebow.png",
    "revision": "257a327858895fc8321057f3d2378215"
  },
  {
    "url": "img/3/item-searage.png",
    "revision": "993d574fd006127f66169228a443b11c"
  },
  {
    "url": "img/3/item-seed.png",
    "revision": "7936d6b94b606a26aff315d7d68fbee0"
  },
  {
    "url": "img/3/item-shadowregionarmor.png",
    "revision": "df30136dc8a061dade41b5d0bcb5fa1b"
  },
  {
    "url": "img/3/item-shardt1.png",
    "revision": "dd1ca6861e650efd3a4435b2cb986819"
  },
  {
    "url": "img/3/item-shardt2.png",
    "revision": "3e944b40b0b5ad1c1c2800f514c6641b"
  },
  {
    "url": "img/3/item-shardt3.png",
    "revision": "acc5eb6ec360edd5afdc5cafcd3eaf71"
  },
  {
    "url": "img/3/item-shardt4.png",
    "revision": "44b1b59c9e0578cffdeed9e3fa676275"
  },
  {
    "url": "img/3/item-shardt5.png",
    "revision": "d74158411c51caf76a7e2e66a4b54275"
  },
  {
    "url": "img/3/item-sickle.png",
    "revision": "16157cbb15461837fe099aaa88c68e10"
  },
  {
    "url": "img/3/item-sicklebow.png",
    "revision": "0946e69f0209b05414c587d4d096a8d0"
  },
  {
    "url": "img/3/item-sidesword.png",
    "revision": "14a2eb681cceac171b70a20b2e995555"
  },
  {
    "url": "img/3/item-skylightbow.png",
    "revision": "daf84827d91cc891d8f7e831dce5bba2"
  },
  {
    "url": "img/3/item-skylightsaber.png",
    "revision": "d970598027a10307741843a77b0ba9c2"
  },
  {
    "url": "img/3/item-snowfoxarcherarmor.png",
    "revision": "d4c60371960fb283e9dd0ef57e3d4029"
  },
  {
    "url": "img/3/item-snowfoxarmor.png",
    "revision": "be8d1997d7a870eadfa9ce4b231c6a21"
  },
  {
    "url": "img/3/item-snowmanarmor.png",
    "revision": "495ad023608f431749a3331d403d80e3"
  },
  {
    "url": "img/3/item-snowpotion.png",
    "revision": "04d2535786d0f992dd0f068dfdd7f084"
  },
  {
    "url": "img/3/item-spear.png",
    "revision": "7f62466f810f4886d50f0a7cb08e0463"
  },
  {
    "url": "img/3/item-spiritring.png",
    "revision": "633a4b27bfbeb712b64092912db6c9be"
  },
  {
    "url": "img/3/item-sproutring.png",
    "revision": "d81ea3cc0efb28da10611e47e6e4135a"
  },
  {
    "url": "img/3/item-squeakyhammer.png",
    "revision": "74b2b78d7faa8a7650fcce74e82171d2"
  },
  {
    "url": "img/3/item-squidarmor.png",
    "revision": "abbacc4833cdf7480cfff7245f84bcd3"
  },
  {
    "url": "img/3/item-sword1.png",
    "revision": "7ebaf004b9ddcda4af4384ddde6b6795"
  },
  {
    "url": "img/3/item-sword2.png",
    "revision": "86919db8e527c3af84bbe63d216bf25d"
  },
  {
    "url": "img/3/item-taekwondo.png",
    "revision": "b69e867c712f344129d688f7f9455ceb"
  },
  {
    "url": "img/3/item-tamagotchiring.png",
    "revision": "39f418555d49a7464766bd5d4c26a15a"
  },
  {
    "url": "img/3/item-thiefarmor.png",
    "revision": "dfd38455d274ff907a0b8b7d4cce9294"
  },
  {
    "url": "img/3/item-tigerarmor.png",
    "revision": "a24b63db751614799a498748adcc12ff"
  },
  {
    "url": "img/3/item-topazring.png",
    "revision": "3cc25eb877c8c8f448ab716f83d04571"
  },
  {
    "url": "img/3/item-trident.png",
    "revision": "044b00b707165cf81732007249cba535"
  },
  {
    "url": "img/3/item-typhoon.png",
    "revision": "4c67a0abd761f24bfc2dee653913d20b"
  },
  {
    "url": "img/3/item-violetbow.png",
    "revision": "7c3814bd8586eaaf525aad056a9b616f"
  },
  {
    "url": "img/3/item-watermelon.png",
    "revision": "a78a5d5484be64cc24802db5ca24714f"
  },
  {
    "url": "img/3/item-watermelonbow.png",
    "revision": "a1776b920993ad6c9a92f1bbb2ab72c8"
  },
  {
    "url": "img/3/item-weaponblade.png",
    "revision": "0b2e4965ee4515441f35817303fd1ce6"
  },
  {
    "url": "img/3/item-weaponcommon.png",
    "revision": "bb428c8dd669c8806180ea753a3b82fb"
  },
  {
    "url": "img/3/item-weaponhilt.png",
    "revision": "775b0a3ee5529596c3b490af42e1b91f"
  },
  {
    "url": "img/3/item-weaponrare.png",
    "revision": "df00ff2f94e8c0b21fa7418e356873df"
  },
  {
    "url": "img/3/item-weaponuncommon.png",
    "revision": "75656f8dc0ae342154d493eeb5be9ec2"
  },
  {
    "url": "img/3/item-weastaff.png",
    "revision": "6ea5dbb9a9c2133efb9f6c6ab3f80339"
  },
  {
    "url": "img/3/item-whip.png",
    "revision": "aa0728362c5fd164bb0c9ba9c4c16f96"
  },
  {
    "url": "img/3/item-whitearcherarmor.png",
    "revision": "1d4e4d1839c5e182adec34f4cbb819aa"
  },
  {
    "url": "img/3/item-whitearmor.png",
    "revision": "dccfee8a2d032f743a1092ac4de39412"
  },
  {
    "url": "img/3/item-wizardrobe.png",
    "revision": "52fdc27fce74a5e61a74f1f82952cedc"
  },
  {
    "url": "img/3/item-wolfarcherarmor.png",
    "revision": "ae26c1e24880aa210be14eb3503c61d2"
  },
  {
    "url": "img/3/item-wolfarmor.png",
    "revision": "0fc33a51faec304061e054b4d2765536"
  },
  {
    "url": "img/3/item-wood.png",
    "revision": "ed0cc54516280dbc4f8a2cd385afd3c9"
  },
  {
    "url": "img/3/item-woodenbow.png",
    "revision": "63c27230f52927590eb318129c1e9874"
  },
  {
    "url": "img/3/main.png",
    "revision": "f0106545f52050572a72612de40c1057"
  },
  {
    "url": "img/3/maintwo.png",
    "revision": "c160688972cd1390b5d1cdf50e11a23f"
  },
  {
    "url": "img/3/mapframe.png",
    "revision": "d3f8b513622c6e98f73315f3b0de0799"
  },
  {
    "url": "img/3/mapicons.png",
    "revision": "87751ac475aa2f0543e96a805ba57644"
  },
  {
    "url": "img/3/pointer.png",
    "revision": "cdbce51182423eea23f5b00e3ef8eea0"
  },
  {
    "url": "img/3/skillicons.png",
    "revision": "cf345ca848204291a809d33070c0d908"
  },
  {
    "url": "img/3/skillslots.png",
    "revision": "18ab286db5e76c767e63ba63b2fef023"
  },
  {
    "url": "img/3/spritesheet.png",
    "revision": "674d29a92cce029ece5eb0ed619269fd"
  },
  {
    "url": "img/3/trade.png",
    "revision": "60ff622b6cefe66a7557492d8e01ab2d"
  },
  {
    "url": "img/background.png",
    "revision": "d41110cf5e10e60224c563763524f4d7"
  },
  {
    "url": "img/favicon.png",
    "revision": "12f7a1b2a69af985302415db673be8fb"
  },
  {
    "url": "img/icons/android-icon-144x144.png",
    "revision": "97000c1dc8159be51b582be3a21075e9"
  },
  {
    "url": "img/icons/android-icon-192x192.png",
    "revision": "380daba331307f3d0df856c53047a161"
  },
  {
    "url": "img/icons/android-icon-36x36.png",
    "revision": "57a4a0ae69ae1a2791d1afbd3800e432"
  },
  {
    "url": "img/icons/android-icon-48x48.png",
    "revision": "6a49671bc0e4e798d2471b91d372ce6e"
  },
  {
    "url": "img/icons/android-icon-72x72.png",
    "revision": "8b8473a6aaf58b7aa26d4470f36fc9b8"
  },
  {
    "url": "img/icons/android-icon-96x96.png",
    "revision": "9e927f76c68640bed67e85951e87fb93"
  },
  {
    "url": "img/icons/apple-icon-114x114.png",
    "revision": "21cd41fa57480f934224d9713b7da0a9"
  },
  {
    "url": "img/icons/apple-icon-120x120.png",
    "revision": "c4e940e39249f1a1ef4824597b017652"
  },
  {
    "url": "img/icons/apple-icon-144x144.png",
    "revision": "97000c1dc8159be51b582be3a21075e9"
  },
  {
    "url": "img/icons/apple-icon-152x152.png",
    "revision": "ff76c8a588eaf2632338fa9046295cb1"
  },
  {
    "url": "img/icons/apple-icon-180x180.png",
    "revision": "d03a89155375c0820e160ac9d7190d69"
  },
  {
    "url": "img/icons/apple-icon-57x57.png",
    "revision": "76577427de51141f94c80240322e9a14"
  },
  {
    "url": "img/icons/apple-icon-60x60.png",
    "revision": "84cf9b10fac84cda9197671bd4abd463"
  },
  {
    "url": "img/icons/apple-icon-72x72.png",
    "revision": "8b8473a6aaf58b7aa26d4470f36fc9b8"
  },
  {
    "url": "img/icons/apple-icon-76x76.png",
    "revision": "c4a7dc4ec0e8a1048295387051fd2369"
  },
  {
    "url": "img/icons/apple-icon-precomposed.png",
    "revision": "52ab2b0194d188a8adf1a398b7ed60b8"
  },
  {
    "url": "img/icons/apple-icon.png",
    "revision": "52ab2b0194d188a8adf1a398b7ed60b8"
  },
  {
    "url": "img/icons/favicon-16x16.png",
    "revision": "e2e72107826141371ef01d03c515b6f8"
  },
  {
    "url": "img/icons/favicon-32x32.png",
    "revision": "33e26cae8daf236ed07b9ad56e27a4a8"
  },
  {
    "url": "img/icons/favicon-96x96.png",
    "revision": "9e927f76c68640bed67e85951e87fb93"
  },
  {
    "url": "img/icons/ms-icon-144x144.png",
    "revision": "97000c1dc8159be51b582be3a21075e9"
  },
  {
    "url": "img/icons/ms-icon-150x150.png",
    "revision": "cb965c522fe0bfb38bee9ba3513e7830"
  },
  {
    "url": "img/icons/ms-icon-310x310.png",
    "revision": "db967b310047180c819c0bc90162b30b"
  },
  {
    "url": "img/icons/ms-icon-70x70.png",
    "revision": "e5ce6c633e42b3561942fb4a2cee3b43"
  },
  {
    "url": "img/overlays/fog.png",
    "revision": "0ab54c9ce2bbb833737696a64c46f6ae"
  },
  {
    "url": "img/overlays/fog1.png",
    "revision": "e4683e2527946c0aed590bb524ca9b72"
  },
  {
    "url": "img/screenshots/screenshot.png",
    "revision": "0a50f74a107b3597487f43ed138a46e6"
  },
  {
    "url": "img/spinner.gif",
    "revision": "20152fb869cb787c7f3bcfe23aef0ad6"
  },
  {
    "url": "img/sprites/achievements.png",
    "revision": "51f8eb3f00345bcad614c631dae1c4b0"
  },
  {
    "url": "img/sprites/adherer.png",
    "revision": "47d292a9b3a33f46f3ca11f12436f83f"
  },
  {
    "url": "img/sprites/adhererarcherarmor.png",
    "revision": "0392bef88c282bf0882549fbc99a8d67"
  },
  {
    "url": "img/sprites/adhererrobe.png",
    "revision": "e51fedb36f2eecb76f3c839efcdcd39b"
  },
  {
    "url": "img/sprites/adminarmor.png",
    "revision": "e08a2044d0bdd9fb35a796dabd34632c"
  },
  {
    "url": "img/sprites/agent.png",
    "revision": "2c306412a70c1683c32e71c8d4a93a76"
  },
  {
    "url": "img/sprites/ancientmanumentnpc.png",
    "revision": "63f5292091c7b8a960a055b372dfa818"
  },
  {
    "url": "img/sprites/angelnpc.png",
    "revision": "9927ed404106b2084f6cae1c063be5ce"
  },
  {
    "url": "img/sprites/ant.png",
    "revision": "2754113b3434d30145d32eaf8ee7b526"
  },
  {
    "url": "img/sprites/archerarmor.png",
    "revision": "7ecd90eff4471a2955c3809e6bf3c26f"
  },
  {
    "url": "img/sprites/archerschooluniform.png",
    "revision": "1aa80973a98e23027952bd9feba3dbd6"
  },
  {
    "url": "img/sprites/axe.png",
    "revision": "161b65db29a5e666e2f6ccc59d27611e"
  },
  {
    "url": "img/sprites/babyspider.png",
    "revision": "42412e5b2fbadadbd5d57c39dd44aedc"
  },
  {
    "url": "img/sprites/bamboospear.png",
    "revision": "c1e033511e0a5b97b94fe49376f7dbd4"
  },
  {
    "url": "img/sprites/barsheet.png",
    "revision": "18c89eaac769103c2e31122782229f2d"
  },
  {
    "url": "img/sprites/basebarcontainer.png",
    "revision": "eac5e2fb763ce02cf398f4e2ed23d8fa"
  },
  {
    "url": "img/sprites/bastardsword.png",
    "revision": "7795859ecaddb1381f19f066d0b99974"
  },
  {
    "url": "img/sprites/bat.png",
    "revision": "a629d890676a8a1217e2234aab2c4c26"
  },
  {
    "url": "img/sprites/beachnpc.png",
    "revision": "31dc6168e7ddaeeca857446d75e5c3f8"
  },
  {
    "url": "img/sprites/bearseonbiarmor.png",
    "revision": "0c390bce0b0820740d2b2cd28d4f9e2c"
  },
  {
    "url": "img/sprites/beautifullife.png",
    "revision": "7d529481cbb14da2cd4398c6ac53fd12"
  },
  {
    "url": "img/sprites/bee.png",
    "revision": "c442264a0cc73146c3d9489cfd5d36d4"
  },
  {
    "url": "img/sprites/beearmor.png",
    "revision": "4de088d9c9e424842821a8f92544b3dc"
  },
  {
    "url": "img/sprites/beetle.png",
    "revision": "7c40aaa7338682eeedc52bd87e2d70e6"
  },
  {
    "url": "img/sprites/beetlearmor.png",
    "revision": "013c9062b96e2276887d1637b5bfffea"
  },
  {
    "url": "img/sprites/blackpirateskeleton.png",
    "revision": "c6499d7f14d2e9b82fabd1f663ccc200"
  },
  {
    "url": "img/sprites/blackspiderarmor.png",
    "revision": "1c4a88d7927df106d53c4cc1120af662"
  },
  {
    "url": "img/sprites/blackwizard.png",
    "revision": "30cad8bcd9d47abbdba9a86dcd3d3bf6"
  },
  {
    "url": "img/sprites/blazespider.png",
    "revision": "79736780577f9c2158ed0f789b0cf66c"
  },
  {
    "url": "img/sprites/bloodbow.png",
    "revision": "d88afaa12a88b688487c9b6d1c6892c7"
  },
  {
    "url": "img/sprites/bloodsucking.png",
    "revision": "fa73a064160f279f0a725ae1a416510c"
  },
  {
    "url": "img/sprites/bluebikinigirlnpc.png",
    "revision": "5c9a95fcff8c2b308eb2de8a331aa0a0"
  },
  {
    "url": "img/sprites/bluecockroach.png",
    "revision": "b63f899c5aea1cc50fffa1c05dfbba8f"
  },
  {
    "url": "img/sprites/bluedamboarmor.png",
    "revision": "acc464742dd59d290a499e83c9fa6c2f"
  },
  {
    "url": "img/sprites/bluepiratearmor.png",
    "revision": "ba06115e392d00a08077c270726fc2af"
  },
  {
    "url": "img/sprites/bluepreta.png",
    "revision": "0b5ccb95e1e800efc84da3aabf5d787f"
  },
  {
    "url": "img/sprites/bluescimitar.png",
    "revision": "eca18dc52c6815f08ba1e21fdbfa601c"
  },
  {
    "url": "img/sprites/bluestoremannpc.png",
    "revision": "35c278dbddeae6938480523b3dd76877"
  },
  {
    "url": "img/sprites/bluesword.png",
    "revision": "16d53003ed3f116390a7584b1d93eac3"
  },
  {
    "url": "img/sprites/bluewingarcherarmor.png",
    "revision": "047bb212dc0910425a012aca2f1f0a7d"
  },
  {
    "url": "img/sprites/bluewingarmor.png",
    "revision": "e1cd86f20adf98b77631b19616d06a67"
  },
  {
    "url": "img/sprites/boss.png",
    "revision": "6696bfd8036892dd1900dabb53f9f8e0"
  },
  {
    "url": "img/sprites/bow.png",
    "revision": "e848b87ebda93e2d0b6d668e81ead417"
  },
  {
    "url": "img/sprites/boxingman.png",
    "revision": "f4680f3ddc114490a4ce30e8ca94b25c"
  },
  {
    "url": "img/sprites/breaker.png",
    "revision": "9605a68ff5f635bba7c0552166d5d97b"
  },
  {
    "url": "img/sprites/bridalmask.png",
    "revision": "bc4c78288714717ddf4d302ebb52757a"
  },
  {
    "url": "img/sprites/bronzemedal.png",
    "revision": "b4901724899a75786e024ccca8193eda"
  },
  {
    "url": "img/sprites/brownmouse.png",
    "revision": "661cbfbd5ba4135782fc0b211bacba6e"
  },
  {
    "url": "img/sprites/bucklerbenef.png",
    "revision": "0d427e3ff361ae238620297a4a0ce056"
  },
  {
    "url": "img/sprites/burgerarmor.png",
    "revision": "e32ada7f74dde2fa5ca8c16f45e1ab88"
  },
  {
    "url": "img/sprites/burningstrike.png",
    "revision": "7dddd500b799dfaa9bd61ae17cc23578"
  },
  {
    "url": "img/sprites/butcherknife.png",
    "revision": "2bc03d16dae20de2c1ee9e240e5fb27e"
  },
  {
    "url": "img/sprites/cactus.png",
    "revision": "387a08de2a1680f1d2bfe102d641128e"
  },
  {
    "url": "img/sprites/cactusaxe.png",
    "revision": "ae931fe67e92f30bab34e79b1f183a42"
  },
  {
    "url": "img/sprites/candybar.png",
    "revision": "e95d71c581d02500e534af1000a082d1"
  },
  {
    "url": "img/sprites/captainbow.png",
    "revision": "ad399c76014b717554c859e9d8b3b8d8"
  },
  {
    "url": "img/sprites/cat.png",
    "revision": "2a54327a0c62f13b24530ab7c298b460"
  },
  {
    "url": "img/sprites/catarmor.png",
    "revision": "5372ed1e3c5e1c0c49886b39fef19331"
  },
  {
    "url": "img/sprites/characterbutton.png",
    "revision": "fa49fa3aabc980965b184b28e25f1499"
  },
  {
    "url": "img/sprites/cheoliarcherarmor.png",
    "revision": "a115b67f53b0360303fbb83ec8caa0a7"
  },
  {
    "url": "img/sprites/cheoliarmor.png",
    "revision": "b84909bbab1da33476997aea69a88253"
  },
  {
    "url": "img/sprites/chest.png",
    "revision": "151c0fee77de5597544252c7e29062c5"
  },
  {
    "url": "img/sprites/christmasarmor.png",
    "revision": "0db853c2522b10096eb9cd7b481f8340"
  },
  {
    "url": "img/sprites/clam.png",
    "revision": "3db85933f001544c12ae03f46e0e671f"
  },
  {
    "url": "img/sprites/clotharmor.png",
    "revision": "3166949de8fb13a96645c2b5579044db"
  },
  {
    "url": "img/sprites/cobra.png",
    "revision": "4de244c7a64df4101e917e48d0845949"
  },
  {
    "url": "img/sprites/cockroachsuit.png",
    "revision": "5c98e6edc1825639b6ea8d1c09fbb9be"
  },
  {
    "url": "img/sprites/coder.png",
    "revision": "2cc649a1402d3c30277b2015221eb321"
  },
  {
    "url": "img/sprites/cokearmor.png",
    "revision": "964b5bcd90563cd404cb729754b99be4"
  },
  {
    "url": "img/sprites/comb.png",
    "revision": "b1e0216d68c6028107b08a3ddeabb923"
  },
  {
    "url": "img/sprites/combatuniform.png",
    "revision": "f329ec563559b9a75791e1a2432f87e9"
  },
  {
    "url": "img/sprites/conferencecall.png",
    "revision": "3147d14971ece5204db44a8b0bab6c96"
  },
  {
    "url": "img/sprites/crab.png",
    "revision": "eac77fa185b03c5f08ac16249d116058"
  },
  {
    "url": "img/sprites/criticaleffect.png",
    "revision": "95cb2b68277a65b0bba7656a918eb92c"
  },
  {
    "url": "img/sprites/criticalstrike.png",
    "revision": "33247be31fec35f055d0359986a26b8a"
  },
  {
    "url": "img/sprites/crystalarcherarmor.png",
    "revision": "ad744a12aa5d01f2fc40dc51ff8f0709"
  },
  {
    "url": "img/sprites/crystalarmor.png",
    "revision": "71eb2fd5664a2a593a80bd0b8457a417"
  },
  {
    "url": "img/sprites/crystalbow.png",
    "revision": "40f88055d1349a1c0e6680af4a78489a"
  },
  {
    "url": "img/sprites/crystalscolpion.png",
    "revision": "c73b4a39fca64435af38ea791dbca39c"
  },
  {
    "url": "img/sprites/cursedhahoemask.png",
    "revision": "f7bf2f077c31ac58f5346a2d7db79413"
  },
  {
    "url": "img/sprites/cursedjangseung.png",
    "revision": "0d499491161f93bf67d7bc7aceb7f863"
  },
  {
    "url": "img/sprites/damboarmor.png",
    "revision": "3e23b82df4c22850e8d95bb4fcf1a96f"
  },
  {
    "url": "img/sprites/darkogre.png",
    "revision": "b2a707caa3fdf96a645dd998cffdfbc8"
  },
  {
    "url": "img/sprites/darkregion.png",
    "revision": "e7ce5d5f0b1440a602ba18e6828aeb6c"
  },
  {
    "url": "img/sprites/darkregionillusion.png",
    "revision": "20325401fffa0cc5fd556a6176876f68"
  },
  {
    "url": "img/sprites/darkscolpion.png",
    "revision": "bdb0c13c096c1d3bb01cd08ad594e42b"
  },
  {
    "url": "img/sprites/darkskeleton.png",
    "revision": "9634c2b4ca8fb14cd660108704e461bb"
  },
  {
    "url": "img/sprites/daywalker.png",
    "revision": "4ef5d5d5a1818008b8c4ffe494fcc45b"
  },
  {
    "url": "img/sprites/death.png",
    "revision": "96e522f93b9c9811f874bfb80f390ecd"
  },
  {
    "url": "img/sprites/deathbow.png",
    "revision": "15decde4ca1874fe88fced25a82353ee"
  },
  {
    "url": "img/sprites/deathknight.png",
    "revision": "cdd5cf72975ccfb39ccdaf2c5fdba3ff"
  },
  {
    "url": "img/sprites/desertnpc.png",
    "revision": "c6c06fa964b3dfc458c63044569c721b"
  },
  {
    "url": "img/sprites/desertscolpion.png",
    "revision": "1d7ad1d94e15001f440e461ef8e56c06"
  },
  {
    "url": "img/sprites/devilkazya.png",
    "revision": "9a6b0e81a81bd7d6b6097997c0f3bbbd"
  },
  {
    "url": "img/sprites/devilkazyaarmor.png",
    "revision": "f4cd4253f4185e1d57f30eccf643917e"
  },
  {
    "url": "img/sprites/devilkazyasword.png",
    "revision": "90981b2eacdbcb0086497327a29ee4c4"
  },
  {
    "url": "img/sprites/dinosaurarmor.png",
    "revision": "e8ce89baafec949942103d552da09d0e"
  },
  {
    "url": "img/sprites/doctor.png",
    "revision": "339eec490f943dfc5593e745805d2844"
  },
  {
    "url": "img/sprites/dovakinarcherarmor.png",
    "revision": "d723e61d08ec45350c47899658110a06"
  },
  {
    "url": "img/sprites/dovakinarmor.png",
    "revision": "5cf32d21f82ce93c86215ea084c2e274"
  },
  {
    "url": "img/sprites/dragonarmor.png",
    "revision": "75c409c40ad045bf625db617d24f6574"
  },
  {
    "url": "img/sprites/earthworm.png",
    "revision": "989b2a573780bfa4c349305254e4a685"
  },
  {
    "url": "img/sprites/elfnpc.png",
    "revision": "982aa768b9a19d198f730df0470a922c"
  },
  {
    "url": "img/sprites/eliminator.png",
    "revision": "76529ba90b7233c3f9a2e0ca1a4bd249"
  },
  {
    "url": "img/sprites/enel.png",
    "revision": "fb5858ac75214be51a0f5b31654c5228"
  },
  {
    "url": "img/sprites/enelarmor.png",
    "revision": "d398a1871fdc81e445d24ea4dc456513"
  },
  {
    "url": "img/sprites/eneltrident.png",
    "revision": "e5f67fc7fde8ce43dc483640ae7139f4"
  },
  {
    "url": "img/sprites/evasion.png",
    "revision": "f318e9ca9c6878c552f83c2d4707b7a1"
  },
  {
    "url": "img/sprites/evilarmor.png",
    "revision": "a0760fe981d3a808f4d750d392d38c8a"
  },
  {
    "url": "img/sprites/expbar.png",
    "revision": "9a8b549657d8e507b7eafdfe6c53f5bb"
  },
  {
    "url": "img/sprites/explosion-boulder.png",
    "revision": "cc6dfff31cde0b5d8a67ce9c16136b47"
  },
  {
    "url": "img/sprites/explosion-fireball.png",
    "revision": "7b7ca25c15afe931b657809437db2e46"
  },
  {
    "url": "img/sprites/explosion-heal.png",
    "revision": "b2cc7576b21aba73c114b94d6af01b18"
  },
  {
    "url": "img/sprites/explosion-iceball.png",
    "revision": "66dc97922d7f68761dcab7c6d257a965"
  },
  {
    "url": "img/sprites/explosion-lavaball.png",
    "revision": "b707b7e1726734e1c0e997cefac41dc2"
  },
  {
    "url": "img/sprites/explosion-terror.png",
    "revision": "df76bcc420b9b28e0e3207b516c016e1"
  },
  {
    "url": "img/sprites/eye.png",
    "revision": "68e2c8bcb1e450b13aeb6ed0a1af5339"
  },
  {
    "url": "img/sprites/fairynpc.png",
    "revision": "6417dadfbe21cab5567c610ba2e98316"
  },
  {
    "url": "img/sprites/fallenarcherarmor.png",
    "revision": "9318daa10de0616790bcb3c05c4fd34e"
  },
  {
    "url": "img/sprites/fallenarmor.png",
    "revision": "ea9aa35f6fcec937fbb54df052d4fbd0"
  },
  {
    "url": "img/sprites/firebenef.png",
    "revision": "0f9cc6bef5f970adb8afbff53b856a3a"
  },
  {
    "url": "img/sprites/firefox.png",
    "revision": "ab0d6fa5483523ebc1f77b6f2598721f"
  },
  {
    "url": "img/sprites/fireplay.png",
    "revision": "2a4bcef1fc66d50b3ac300ff7fe7612c"
  },
  {
    "url": "img/sprites/fireshot.png",
    "revision": "3111bbce5d3a76fc318537d33c755502"
  },
  {
    "url": "img/sprites/firespider.png",
    "revision": "a2c7eac5f11dbfd25e17ba7ba6a61035"
  },
  {
    "url": "img/sprites/firesword.png",
    "revision": "6a045cc46ca24d344a7ed4ff836c2f70"
  },
  {
    "url": "img/sprites/firstsonangelnpc.png",
    "revision": "0a369203ae82c3b9c6a696072a767bd0"
  },
  {
    "url": "img/sprites/fisherman.png",
    "revision": "9f5ae51e497d4967581694b05f17bfd6"
  },
  {
    "url": "img/sprites/flaredance.png",
    "revision": "4a01bd5863ef6b916680febd3c0bed51"
  },
  {
    "url": "img/sprites/flaredanceeffect.png",
    "revision": "5c6a5d5645ea404e3d524145b859e64b"
  },
  {
    "url": "img/sprites/flaredeathknight.png",
    "revision": "1d51da32e881186f0f532311a7eb568d"
  },
  {
    "url": "img/sprites/fluffy.png",
    "revision": "6bb950885358a9add3d866947e541a4b"
  },
  {
    "url": "img/sprites/forestbow.png",
    "revision": "642da433def07ec09a98b2a9eea9a2a3"
  },
  {
    "url": "img/sprites/forestdragon.png",
    "revision": "c8ea2b307c4ca7a4251e0ac5e821bcfe"
  },
  {
    "url": "img/sprites/forestguardiansword.png",
    "revision": "dfb2655539da270d36444de65c398523"
  },
  {
    "url": "img/sprites/forestnpc.png",
    "revision": "ea8ff5e5dba8ebf5f90ee24edb32b778"
  },
  {
    "url": "img/sprites/frankensteinarmor.png",
    "revision": "133b9d1906a6efaddcbc63c857d0b009"
  },
  {
    "url": "img/sprites/friedpotatoarmor.png",
    "revision": "7b7ed95d34cbbd88e6e25114c8268450"
  },
  {
    "url": "img/sprites/frog.png",
    "revision": "448d919fff9de05c98b05118be4d0e9b"
  },
  {
    "url": "img/sprites/frogarmor.png",
    "revision": "bf0acd9addf612d06d4ce3562460dd95"
  },
  {
    "url": "img/sprites/frostarmor.png",
    "revision": "48bf3d707b4d0e640aa0a98bfa4b96ef"
  },
  {
    "url": "img/sprites/frostqueen.png",
    "revision": "37d796432f900efc27bb9225489d6c73"
  },
  {
    "url": "img/sprites/gayarcherarmor.png",
    "revision": "8134c15bef1d935659e411df1ace1082"
  },
  {
    "url": "img/sprites/gayarmor.png",
    "revision": "ede8b75ee6080377af423b3ad4ebd8e4"
  },
  {
    "url": "img/sprites/gaybow.png",
    "revision": "d4b28426949b038faad6c3f86d232590"
  },
  {
    "url": "img/sprites/gbwingarcherarmor.png",
    "revision": "d90602762f8c316c8b41fd87daf97fd9"
  },
  {
    "url": "img/sprites/gbwingarmor.png",
    "revision": "2d8b0ee93929b12e5897344037a53a3e"
  },
  {
    "url": "img/sprites/ghost.png",
    "revision": "5f446a9e98f5ffff07b6aa0587cbb6c1"
  },
  {
    "url": "img/sprites/ghostrider.png",
    "revision": "94373f34c76ab21feb907ec7b0473716"
  },
  {
    "url": "img/sprites/goblin.png",
    "revision": "f663065b2bb04b64a11ade441ace900e"
  },
  {
    "url": "img/sprites/goldaxe.png",
    "revision": "042c84b8ebfa92846d6baaebd28dd701"
  },
  {
    "url": "img/sprites/goldenarcherarmor.png",
    "revision": "121be624a62563e6d9938995853d0481"
  },
  {
    "url": "img/sprites/goldenarmor.png",
    "revision": "a707c82587e56b00e345eef672bc2579"
  },
  {
    "url": "img/sprites/goldenbow.png",
    "revision": "156c2378f007e5a8e9e35ecdb8b8fc28"
  },
  {
    "url": "img/sprites/goldensword.png",
    "revision": "53c008766cfbba2ae2c0ee2e5bd3f735"
  },
  {
    "url": "img/sprites/goldgolem.png",
    "revision": "7417508935a344ecfab885f4d092c03a"
  },
  {
    "url": "img/sprites/goldmedal.png",
    "revision": "b06771f523b966fd9740accc6755dad4"
  },
  {
    "url": "img/sprites/golem.png",
    "revision": "10f97f39522435fc131ff326965a9bb7"
  },
  {
    "url": "img/sprites/greenarcherarmor.png",
    "revision": "1998ed9098c284093c86f1069f6ed81d"
  },
  {
    "url": "img/sprites/greenarmor.png",
    "revision": "09ed9ad10377814b06e361d46f276288"
  },
  {
    "url": "img/sprites/greenbow.png",
    "revision": "42aa4f118727aeabe58f493ab97e96b9"
  },
  {
    "url": "img/sprites/greendamboarmor.png",
    "revision": "f101b9f78a34f46ae7590e96dd2c9d0c"
  },
  {
    "url": "img/sprites/greenfish.png",
    "revision": "e4eb1cec311517529fe6235c287b379e"
  },
  {
    "url": "img/sprites/greenlightbow.png",
    "revision": "a786110b2ef4765d5a93068ad4ce6abb"
  },
  {
    "url": "img/sprites/greenlightsaber.png",
    "revision": "37ad3fe4ea19dfc0967cbd106320c194"
  },
  {
    "url": "img/sprites/greenpirateskeleton.png",
    "revision": "aeb9698a852a1fc891f33d2871e0fd8d"
  },
  {
    "url": "img/sprites/greenwingarcherarmor.png",
    "revision": "8abef25767a4737dc5695eab08514797"
  },
  {
    "url": "img/sprites/greenwingarmor.png",
    "revision": "262270ea7f94327485870196e287ecf8"
  },
  {
    "url": "img/sprites/guard.png",
    "revision": "2d3596014b058511a15959aaf56e35a2"
  },
  {
    "url": "img/sprites/guardarcherarmor.png",
    "revision": "54bbb7e2a53c8647f3ca42c1b4acf2cc"
  },
  {
    "url": "img/sprites/guardarmor.png",
    "revision": "549229ade790ac271e03b1d58ce07134"
  },
  {
    "url": "img/sprites/halberd.png",
    "revision": "33a7e26f16cfcd47b00a552f855a2501"
  },
  {
    "url": "img/sprites/halloweenjkarmor.png",
    "revision": "2c070ef5c26c1539d4a03ca18a7cc927"
  },
  {
    "url": "img/sprites/hammer.png",
    "revision": "956e18b92483062f7a18f0c26c0bd356"
  },
  {
    "url": "img/sprites/hand.png",
    "revision": "4fb5e7d044a588e1cae53ceab4303c38"
  },
  {
    "url": "img/sprites/heal.png",
    "revision": "7b13c2b76990d25754e9eca9303d72e6"
  },
  {
    "url": "img/sprites/healactiveicon.png",
    "revision": "ae7657278ae78c52408d9a315f4f877c"
  },
  {
    "url": "img/sprites/healeffect.png",
    "revision": "b4698e16ca87d7ce32ff0be1bb79bb92"
  },
  {
    "url": "img/sprites/hellspider.png",
    "revision": "c1441a5d4c0b0e85675ee37de5322c85"
  },
  {
    "url": "img/sprites/helpbutton.png",
    "revision": "2d9cbeda34b4584ccd3fababaa4dd7fc"
  },
  {
    "url": "img/sprites/hermitcrab.png",
    "revision": "71f1c860335f4b2fc713d6570af0cd06"
  },
  {
    "url": "img/sprites/hobgoblin.png",
    "revision": "1eeab85edf55ff8c64f01a70ed743183"
  },
  {
    "url": "img/sprites/hongcheol.png",
    "revision": "d60e813d8763acb3ea7784ec4239529e"
  },
  {
    "url": "img/sprites/hongcheolarmor.png",
    "revision": "096f5514c39fcb501433dfc2ce5b3132"
  },
  {
    "url": "img/sprites/hpbar.png",
    "revision": "8afff57c0d335c5d93aee96670d7aa88"
  },
  {
    "url": "img/sprites/huniarmor.png",
    "revision": "49c3a3954714c7ff0bb1925e21818fd1"
  },
  {
    "url": "img/sprites/hunterbow.png",
    "revision": "64caf89ab251e5ff338884d7767673dd"
  },
  {
    "url": "img/sprites/iamverycoldnpc.png",
    "revision": "ee56aa4a61ad34a9a0c6509094dbae00"
  },
  {
    "url": "img/sprites/iceelfnpc.png",
    "revision": "deee8de56591d9b1feefe3247dd750dc"
  },
  {
    "url": "img/sprites/icegoblin.png",
    "revision": "c1ac4e6afc04e3b79cc0a55b3b2f649c"
  },
  {
    "url": "img/sprites/icegolem.png",
    "revision": "8e1f4d346279c0a7044331b88e5d36a0"
  },
  {
    "url": "img/sprites/iceknight.png",
    "revision": "0f3174eed2bd802ca37d2ff0235579ef"
  },
  {
    "url": "img/sprites/icerose.png",
    "revision": "5f8837987784612dd0f5820956201606"
  },
  {
    "url": "img/sprites/icevulture.png",
    "revision": "39532d58d89fd61a6581ee8a1d9a73ad"
  },
  {
    "url": "img/sprites/infectedguard.png",
    "revision": "ae6c75c0c18082a962729498561974e7"
  },
  {
    "url": "img/sprites/inventory.png",
    "revision": "e7bdddc0a689e39f37d68edbd7593831"
  },
  {
    "url": "img/sprites/ironbow.png",
    "revision": "7b9162bb621f9d85be17e236b49e91c5"
  },
  {
    "url": "img/sprites/ironknightarmor.png",
    "revision": "36b68de1020b89ef215a25c4229237e5"
  },
  {
    "url": "img/sprites/ironogre.png",
    "revision": "2a012ee5e20ef555770adcd3ad23864d"
  },
  {
    "url": "img/sprites/item-adhererarcherarmor.png",
    "revision": "4b60a671e338f39dc19da3b5bf27a70c"
  },
  {
    "url": "img/sprites/item-adhererrobe.png",
    "revision": "791679cfbe9758e2b33eeb6160fb34fa"
  },
  {
    "url": "img/sprites/item-adminarmor.png",
    "revision": "88d734e3825abc9d47085a9df42ec4e5"
  },
  {
    "url": "img/sprites/item-apple.png",
    "revision": "1d42814891e0b73a2096a766c2b5d17e"
  },
  {
    "url": "img/sprites/item-archerarmor.png",
    "revision": "8cee66c9663bd7a524ab0dd6497ee4b5"
  },
  {
    "url": "img/sprites/item-archerschooluniform.png",
    "revision": "9cab1b0592b287b39516d390f62efd21"
  },
  {
    "url": "img/sprites/item-armorbinding.png",
    "revision": "81755b5e8faf30c9588931ba1ed60339"
  },
  {
    "url": "img/sprites/item-armorcommon.png",
    "revision": "83acf99ac7fd05b6a036b847710223b4"
  },
  {
    "url": "img/sprites/item-armorpatches.png",
    "revision": "18a9b0dfd9f53a13b7bcd50d361527ca"
  },
  {
    "url": "img/sprites/item-armorrare.png",
    "revision": "27fc11aaf7bc6e64f925515d4907673a"
  },
  {
    "url": "img/sprites/item-armoruncommon.png",
    "revision": "77354efca88f2f8a81ef8687783ffc8b"
  },
  {
    "url": "img/sprites/item-axe.png",
    "revision": "cc7247a03b653fac3ef9b5036ea3a0e0"
  },
  {
    "url": "img/sprites/item-bamboospear.png",
    "revision": "74da24877d137e58cff5e6f0f129fc47"
  },
  {
    "url": "img/sprites/item-banana.png",
    "revision": "4cd0021939583ecc82c004baa585653f"
  },
  {
    "url": "img/sprites/item-bastardsword.png",
    "revision": "50820e4ba5f58ad4a1349fc63a54ec44"
  },
  {
    "url": "img/sprites/item-bearseonbiarmor.png",
    "revision": "ea09225a1b6756a6a886e1b2943f1a57"
  },
  {
    "url": "img/sprites/item-beautifullife.png",
    "revision": "3a957def6eaf4c4ca72f7fe0cfcb10be"
  },
  {
    "url": "img/sprites/item-beearmor.png",
    "revision": "d606ecd0cea9adacfbb1ba9756ca0992"
  },
  {
    "url": "img/sprites/item-beetlearmor.png",
    "revision": "4156a197e0afe986ee4d609c076dfd31"
  },
  {
    "url": "img/sprites/item-bigflask.png",
    "revision": "98ccee6db13c7ccbf22cc2d898b71cd0"
  },
  {
    "url": "img/sprites/item-blackpotion.png",
    "revision": "cb5007ad5c7be058f90e40e877985947"
  },
  {
    "url": "img/sprites/item-blackspiderarmor.png",
    "revision": "c4e9515fffa15e656937e92039cab9a2"
  },
  {
    "url": "img/sprites/item-bloodbow.png",
    "revision": "06ce54f88553f375ab396e08d436aa2d"
  },
  {
    "url": "img/sprites/item-bluedamboarmor.png",
    "revision": "1e076b3af5a327af0c84bbb5eeb36b3d"
  },
  {
    "url": "img/sprites/item-bluepiratearmor.png",
    "revision": "d44dee83cf2a5437a26b805a493641f9"
  },
  {
    "url": "img/sprites/item-bluescimitar.png",
    "revision": "d26e597ed95cdd280f09f49be7532dbf"
  },
  {
    "url": "img/sprites/item-bluesword.png",
    "revision": "1da83f35768821ce9040ae302401da4e"
  },
  {
    "url": "img/sprites/item-bluewingarcherarmor.png",
    "revision": "708312f62d45772c15d7c4133a5d5fbb"
  },
  {
    "url": "img/sprites/item-bluewingarmor.png",
    "revision": "224c8f74c3a1b69afccb599f6f443592"
  },
  {
    "url": "img/sprites/item-book.png",
    "revision": "13e419b269289d8365c58cd7e23a1774"
  },
  {
    "url": "img/sprites/item-bowcommon.png",
    "revision": "28716e581538ba92159e3f59bb65b41b"
  },
  {
    "url": "img/sprites/item-bowlimb.png",
    "revision": "09e5468c81a5b04ad0b50a4209509990"
  },
  {
    "url": "img/sprites/item-bowrare.png",
    "revision": "4aeb153ac80e249a165afd697a90b6ce"
  },
  {
    "url": "img/sprites/item-bowstring.png",
    "revision": "bd1a57c45eb4cd842212cf1d9fd9c9c4"
  },
  {
    "url": "img/sprites/item-bowuncommon.png",
    "revision": "bdba994cb51969f6a11c44b606b3008f"
  },
  {
    "url": "img/sprites/item-branch.png",
    "revision": "dfb8b5b3bae8b3f31db6093e3d17e120"
  },
  {
    "url": "img/sprites/item-breaker.png",
    "revision": "16d3823cd9cf95623ec9f977ddabc14d"
  },
  {
    "url": "img/sprites/item-bridalmask.png",
    "revision": "bbb326b48d1321ea700de0f8f73b073b"
  },
  {
    "url": "img/sprites/item-burger.png",
    "revision": "7b0cc86c409fa427e6547e540c943993"
  },
  {
    "url": "img/sprites/item-burgerarmor.png",
    "revision": "b811374fbc0f9e2960bd4332e6f5bf36"
  },
  {
    "url": "img/sprites/item-butcherknife.png",
    "revision": "1b4d3a557362481a0eac19810c7ce3db"
  },
  {
    "url": "img/sprites/item-cactusaxe.png",
    "revision": "e36f0ffb62d7f80fcbf1f20c3436a461"
  },
  {
    "url": "img/sprites/item-cake.png",
    "revision": "a08f605252ef273e517171cb1fd7f22e"
  },
  {
    "url": "img/sprites/item-candybar.png",
    "revision": "afafc7017188f5259233a84d7e0c63dc"
  },
  {
    "url": "img/sprites/item-captainbow.png",
    "revision": "19b8fb82019b135656aa785277de8378"
  },
  {
    "url": "img/sprites/item-catarmor.png",
    "revision": "e59bdfcf72733b638ab0dd0cdad22544"
  },
  {
    "url": "img/sprites/item-cd.png",
    "revision": "8538366d936aa5d04f9fb97b26e1a59f"
  },
  {
    "url": "img/sprites/item-cheoliarcherarmor.png",
    "revision": "3916ff2d6745b4312260dbce7f8553db"
  },
  {
    "url": "img/sprites/item-cheoliarmor.png",
    "revision": "4f2a377cf5e6f9760c446b5a083f89e8"
  },
  {
    "url": "img/sprites/item-christmasarmor.png",
    "revision": "1531fe1b10808598ed7d4e7af76dcb7f"
  },
  {
    "url": "img/sprites/item-cloth.png",
    "revision": "98c6269df57bcb466b48157c5b94a8aa"
  },
  {
    "url": "img/sprites/item-clotharmor.png",
    "revision": "680ed3c75751cdf80a351713d679040c"
  },
  {
    "url": "img/sprites/item-cockroachsuit.png",
    "revision": "83520113faf978dd4d27a4efbdb4a088"
  },
  {
    "url": "img/sprites/item-cokearmor.png",
    "revision": "83cb15eebf9e34b430ab2463808038c3"
  },
  {
    "url": "img/sprites/item-comb.png",
    "revision": "eb7ad267d343c6f0f4cf3bb5482ff038"
  },
  {
    "url": "img/sprites/item-combatuniform.png",
    "revision": "a0e676f8a7f1ff4afe1e2e3ac44ede89"
  },
  {
    "url": "img/sprites/item-conferencecall.png",
    "revision": "dfdb7baed01a0eb9ec9353614a475a36"
  },
  {
    "url": "img/sprites/item-crystalarcherarmor.png",
    "revision": "236860315f1c16d3c65b072d1ed565f4"
  },
  {
    "url": "img/sprites/item-crystalarmor.png",
    "revision": "9dc3e6b1c04724172bc4f977f2557a3f"
  },
  {
    "url": "img/sprites/item-crystalbow.png",
    "revision": "81a331c5ead1b3e2633ed57e328ad6b8"
  },
  {
    "url": "img/sprites/item-damboarmor.png",
    "revision": "1d119e001be392589b384e28470e5316"
  },
  {
    "url": "img/sprites/item-daywalker.png",
    "revision": "b1c2507042c2368491537d28dba33892"
  },
  {
    "url": "img/sprites/item-deathbow.png",
    "revision": "ef8cd7c18ca6e45071264491d43bc657"
  },
  {
    "url": "img/sprites/item-devilkazyaarmor.png",
    "revision": "9e0b7f40817502cd6a63e544f05e6ecd"
  },
  {
    "url": "img/sprites/item-devilkazyasword.png",
    "revision": "3218d2421b38e168229b465046cdd0f2"
  },
  {
    "url": "img/sprites/item-diamondring.png",
    "revision": "4a2e5dfec1eddd72de6034247e4ed8be"
  },
  {
    "url": "img/sprites/item-dinosaurarmor.png",
    "revision": "8324e1c9338cc85dd01e7ffe9031fada"
  },
  {
    "url": "img/sprites/item-dolring.png",
    "revision": "fa66fdb101b9dca5c395d8fb9db9b64f"
  },
  {
    "url": "img/sprites/item-dovakinarcherarmor.png",
    "revision": "330267149e3687071248bf992f37289b"
  },
  {
    "url": "img/sprites/item-dovakinarmor.png",
    "revision": "c8354f32e772a009902cc8fc18f54cf2"
  },
  {
    "url": "img/sprites/item-dragonarmor.png",
    "revision": "22e6788db04c9efbf005919255fe8f46"
  },
  {
    "url": "img/sprites/item-element.png",
    "revision": "26a81c8c6312537482f91e6f4291fd62"
  },
  {
    "url": "img/sprites/item-emeraldring.png",
    "revision": "8426f2a922941496ff3a2bf97852cfcf"
  },
  {
    "url": "img/sprites/item-enelarmor.png",
    "revision": "68970293f44f6eb7cd8a134bba23ee2f"
  },
  {
    "url": "img/sprites/item-eneltrident.png",
    "revision": "e4244c84a3b99dc63c9cebc0cb927053"
  },
  {
    "url": "img/sprites/item-essentialrage.png",
    "revision": "aff24ab7896c372921df8f798f4041e5"
  },
  {
    "url": "img/sprites/item-evilarmor.png",
    "revision": "175d65432473623bff72789ff69fd992"
  },
  {
    "url": "img/sprites/item-fallenarcherarmor.png",
    "revision": "4092af47177e031dc4b39e1ec2e1d336"
  },
  {
    "url": "img/sprites/item-fallenarmor.png",
    "revision": "d45b8e78d7453a9d88d74523ce5b9647"
  },
  {
    "url": "img/sprites/item-fireplay.png",
    "revision": "a4fdece0d99ea1d3dbcabdd2ba938269"
  },
  {
    "url": "img/sprites/item-firepotion.png",
    "revision": "bdf0e5e9a5cc1c2147ff427b4f43a954"
  },
  {
    "url": "img/sprites/item-fireshot.png",
    "revision": "5b4cdc109dd2ee91905106a620be1a7f"
  },
  {
    "url": "img/sprites/item-firesword.png",
    "revision": "0ecb19084a3abdbb5e86cd6956699ef4"
  },
  {
    "url": "img/sprites/item-flask.png",
    "revision": "8725000a09b5844be7ef4682e069bf05"
  },
  {
    "url": "img/sprites/item-forestbow.png",
    "revision": "28f6ce187035e289beb42fe81ca9b9e0"
  },
  {
    "url": "img/sprites/item-forestguardiansword.png",
    "revision": "2c3600841b16ba2b2f7266914951e505"
  },
  {
    "url": "img/sprites/item-frankensteinarmor.png",
    "revision": "914f5598c08c4139229f3a57eddc1e6a"
  },
  {
    "url": "img/sprites/item-friedpotatoarmor.png",
    "revision": "de4c3d87b0668af8281d6734fee1d4a5"
  },
  {
    "url": "img/sprites/item-frogarmor.png",
    "revision": "705e933ce7fe6bc1973de8f2ea435659"
  },
  {
    "url": "img/sprites/item-frostarmor.png",
    "revision": "25f6db0c4ebce9c8aa91378a0923efe3"
  },
  {
    "url": "img/sprites/item-gayarcherarmor.png",
    "revision": "4e2ad999123b163c198215cb9cee3e0a"
  },
  {
    "url": "img/sprites/item-gayarmor.png",
    "revision": "4b3aa6641e5215c5b04fe96c87a22e29"
  },
  {
    "url": "img/sprites/item-gaybow.png",
    "revision": "f9b84f11775078d5013f96197a0aeb65"
  },
  {
    "url": "img/sprites/item-gbwingarcherarmor.png",
    "revision": "13d00d11d66776b8a47530f3ed0170a3"
  },
  {
    "url": "img/sprites/item-gbwingarmor.png",
    "revision": "f03e0d3c559541867e496775b97b8bc8"
  },
  {
    "url": "img/sprites/item-ghostrider.png",
    "revision": "da02e32a2be1abfdf936dcab67640b3a"
  },
  {
    "url": "img/sprites/item-gold.png",
    "revision": "8de6cf3f1f25914a5021a4365a8084d2"
  },
  {
    "url": "img/sprites/item-goldaxe.png",
    "revision": "423c480ea6cf8ea53cb7db0cf97b2899"
  },
  {
    "url": "img/sprites/item-goldenarcherarmor.png",
    "revision": "8aa2bc5c0e6d671f22bb455bf230605b"
  },
  {
    "url": "img/sprites/item-goldenarmor.png",
    "revision": "f6d934561565b7d5de30365a1d495461"
  },
  {
    "url": "img/sprites/item-goldenbow.png",
    "revision": "d1fbe9c5425758c20339b7563b1a4d18"
  },
  {
    "url": "img/sprites/item-goldensword.png",
    "revision": "76b095d5ef3b4f5fe21e948aa7bebf9d"
  },
  {
    "url": "img/sprites/item-goldring.png",
    "revision": "a3af5fe1eb9be3bb938cc86c7b1c97c0"
  },
  {
    "url": "img/sprites/item-greenarcherarmor.png",
    "revision": "461ea0f80706349713fc754cf837c46d"
  },
  {
    "url": "img/sprites/item-greenarmor.png",
    "revision": "f19fed1ae4707c656ed89cf138e32098"
  },
  {
    "url": "img/sprites/item-greenbow.png",
    "revision": "e8813399828d2e3fe40ceaa295ac3460"
  },
  {
    "url": "img/sprites/item-greendamboarmor.png",
    "revision": "adf342aa0772eafcafd1d4f1934edd16"
  },
  {
    "url": "img/sprites/item-greenlightbow.png",
    "revision": "6d5d059c13c4684305547d0fe37237ce"
  },
  {
    "url": "img/sprites/item-greenlightsaber.png",
    "revision": "81d0c26b50f35ec697d53119e58ad263"
  },
  {
    "url": "img/sprites/item-greenpendant.png",
    "revision": "645e1ef5320b520ebaa13f25d324f43e"
  },
  {
    "url": "img/sprites/item-greenwingarcherarmor.png",
    "revision": "4a5825a5fc5ae54493e93bf8ccec0a75"
  },
  {
    "url": "img/sprites/item-greenwingarmor.png",
    "revision": "835aba0fd6d445c55ea9f5a95204c1ef"
  },
  {
    "url": "img/sprites/item-guardarcherarmor.png",
    "revision": "a533e07ef0d49316d1afc60cd4542a21"
  },
  {
    "url": "img/sprites/item-guardarmor.png",
    "revision": "daf564c5c10a2b7cc9eb78060828b8ed"
  },
  {
    "url": "img/sprites/item-halberd.png",
    "revision": "d60589a1b76f315c7248ecae3aa172e5"
  },
  {
    "url": "img/sprites/item-halloweenjkarmor.png",
    "revision": "fa43ceb978a89d3746e1f9986cc233a7"
  },
  {
    "url": "img/sprites/item-hammer.png",
    "revision": "88f69a7c08da0a7d6840130117d6f44b"
  },
  {
    "url": "img/sprites/item-hongcheolarmor.png",
    "revision": "cd4e583cf5329648010b1c7434d649e0"
  },
  {
    "url": "img/sprites/item-huniarmor.png",
    "revision": "172648a1845929858805ba57fcdbd3ba"
  },
  {
    "url": "img/sprites/item-hunterbow.png",
    "revision": "72799a19c83584c864b2db8a7b5bac24"
  },
  {
    "url": "img/sprites/item-icerose.png",
    "revision": "c48b7c9897ae5af004acf68afde38e2a"
  },
  {
    "url": "img/sprites/item-ironbow.png",
    "revision": "05390c96037ec1c6e3a2eaf18daa8fab"
  },
  {
    "url": "img/sprites/item-ironknightarmor.png",
    "revision": "feb808fe32cd9a5084d3c965e493e6bc"
  },
  {
    "url": "img/sprites/item-justicebow.png",
    "revision": "f0d371339a48ca4282e73e136e678819"
  },
  {
    "url": "img/sprites/item-justicehammer.png",
    "revision": "68237b08093e27646760042239c8b38e"
  },
  {
    "url": "img/sprites/item-leaf.png",
    "revision": "77cfcfad8607e853db13fc2da3947a65"
  },
  {
    "url": "img/sprites/item-leatherarcherarmor.png",
    "revision": "79f8b1bac974fa2b8cb744229894e7b5"
  },
  {
    "url": "img/sprites/item-leatherarmor.png",
    "revision": "5c2900b80e5e3568ee0230b17508ab26"
  },
  {
    "url": "img/sprites/item-legolasarmor.png",
    "revision": "105896e414023cf44f46413b75043ad7"
  },
  {
    "url": "img/sprites/item-loveactring.png",
    "revision": "eb5e211414ead9d2db5862be5ae856ea"
  },
  {
    "url": "img/sprites/item-machete.png",
    "revision": "6c3d4be643b722295431f1ec8d4b5381"
  },
  {
    "url": "img/sprites/item-magicspear.png",
    "revision": "befec4103ddc5417a19568d149d6a7c2"
  },
  {
    "url": "img/sprites/item-mailarcherarmor.png",
    "revision": "5d87d9ef96a5b7eea42dbce63db66fc2"
  },
  {
    "url": "img/sprites/item-mailarmor.png",
    "revision": "647fcc87c5b1ab0ab7a17161abac34d3"
  },
  {
    "url": "img/sprites/item-manaflask.png",
    "revision": "bd2130fb0f85fb8eab63c4bdf366a420"
  },
  {
    "url": "img/sprites/item-marblependant.png",
    "revision": "f23a59149dc1f5c03ee8969b7e8c393c"
  },
  {
    "url": "img/sprites/item-marinebow.png",
    "revision": "110beed9daa0241802689774b3948f8b"
  },
  {
    "url": "img/sprites/item-memme.png",
    "revision": "0a81adf283c097abaa4808f9b8d199c4"
  },
  {
    "url": "img/sprites/item-mermaidbow.png",
    "revision": "1730acb38565e01a9953a3117045df05"
  },
  {
    "url": "img/sprites/item-mineral.png",
    "revision": "30e8cfe1986a20219d33d5e470cee5d1"
  },
  {
    "url": "img/sprites/item-miniseadragonarmor.png",
    "revision": "f858faa45cb8201c76c5ed220cadf968"
  },
  {
    "url": "img/sprites/item-morningstar.png",
    "revision": "2a7d76fa482a528c7d8fa17a422cf5b3"
  },
  {
    "url": "img/sprites/item-mountforestdragon.png",
    "revision": "35741cda3e2e2aa2dff7b58a7852f4b7"
  },
  {
    "url": "img/sprites/item-mountseadragon.png",
    "revision": "67747397035a4657eba7d6cd278a1e82"
  },
  {
    "url": "img/sprites/item-mountwhitetiger.png",
    "revision": "57a57682abf5f16214368592292ca080"
  },
  {
    "url": "img/sprites/item-ninjaarmor.png",
    "revision": "1ed91ede76f0db36c5a147024ef8e14d"
  },
  {
    "url": "img/sprites/item-null.png",
    "revision": "b1119cc3d728e744e9c172910d66596b"
  },
  {
    "url": "img/sprites/item-orange.png",
    "revision": "ddfc4ab3adf5a7e3667f55c611f82d81"
  },
  {
    "url": "img/sprites/item-paewoldo.png",
    "revision": "700b65475c60dfc1412ddec2db1a8811"
  },
  {
    "url": "img/sprites/item-paladinarmor.png",
    "revision": "b9f5b23d1b6c07f9a6e5003649f7c5a1"
  },
  {
    "url": "img/sprites/item-pearlpendant.png",
    "revision": "59397b5d38b6d0076a49d0af9a03b06a"
  },
  {
    "url": "img/sprites/item-pearlring.png",
    "revision": "757a989a7e696f7ee305b68df55759b5"
  },
  {
    "url": "img/sprites/item-pendant1.png",
    "revision": "bbde22ebb7954ad8d170fc6c478ee9df"
  },
  {
    "url": "img/sprites/item-pickle.png",
    "revision": "6261a81fadd7bfe46bda48366b59e535"
  },
  {
    "url": "img/sprites/item-pinkcockroacharmor.png",
    "revision": "dd81b5dffe496d07ff57bcee8a2affb7"
  },
  {
    "url": "img/sprites/item-pinksword.png",
    "revision": "26faf31ba0dea506f57c7796727f2ab6"
  },
  {
    "url": "img/sprites/item-piratearcherarmor.png",
    "revision": "7cf2a30679d40684acb95ca3b434f574"
  },
  {
    "url": "img/sprites/item-pirateking.png",
    "revision": "e5a1f81f97e67442baf59c5e3dd2af58"
  },
  {
    "url": "img/sprites/item-plasticbow.png",
    "revision": "13359832b08da61aa2f4e50785f56228"
  },
  {
    "url": "img/sprites/item-platearcherarmor.png",
    "revision": "3ce333e5212d9ef8250396dd15a23e56"
  },
  {
    "url": "img/sprites/item-platearmor.png",
    "revision": "e9db5e1d3078d3edc62e8a04d7ff2a9e"
  },
  {
    "url": "img/sprites/item-plunger.png",
    "revision": "c1f307352ce70c39a7fe4ab45d3372b5"
  },
  {
    "url": "img/sprites/item-portalarmor.png",
    "revision": "405b7e5700f8ae4f987444cdddd3758b"
  },
  {
    "url": "img/sprites/item-powerarmour.png",
    "revision": "54c96926927185cf01b28ca3db25aa50"
  },
  {
    "url": "img/sprites/item-powersword.png",
    "revision": "b99c650ba405aa7e6c49f11a4d938074"
  },
  {
    "url": "img/sprites/item-purplecloudkallege.png",
    "revision": "e78515fd5a0912c4e5ee42bdb3a0339e"
  },
  {
    "url": "img/sprites/item-rabbitarmor.png",
    "revision": "7145bdea97e6323ea94d3622979a088b"
  },
  {
    "url": "img/sprites/item-radisharmor.png",
    "revision": "d8ab720f763c070f49135f7dec437f3a"
  },
  {
    "url": "img/sprites/item-rainbowapro.png",
    "revision": "fc2c92ba91a5b874426e7c80612f5378"
  },
  {
    "url": "img/sprites/item-rainbowsword.png",
    "revision": "02c6d575bbd7c649069bacd4994474c2"
  },
  {
    "url": "img/sprites/item-ratarcherarmor.png",
    "revision": "f1faee91a24a68c953106615100ed7c7"
  },
  {
    "url": "img/sprites/item-ratarmor.png",
    "revision": "59bd880be7c5e76972ce4892bbc0774c"
  },
  {
    "url": "img/sprites/item-redarcherarmor.png",
    "revision": "61c342c6a1eb803ed8020c690374b0a8"
  },
  {
    "url": "img/sprites/item-redarmor.png",
    "revision": "1732ebae5a8522e43e1116d958429be2"
  },
  {
    "url": "img/sprites/item-redbow.png",
    "revision": "34365072622de8a2897a867f9f7fe24e"
  },
  {
    "url": "img/sprites/item-reddamboarmor.png",
    "revision": "b53af43fac184f017155f05fb97cc51f"
  },
  {
    "url": "img/sprites/item-redenelbow.png",
    "revision": "610b642bc2af70c70320dfed46069105"
  },
  {
    "url": "img/sprites/item-redguardarcherarmor.png",
    "revision": "7b9dbe96a03960963e38252c59a35e68"
  },
  {
    "url": "img/sprites/item-redguardarmor.png",
    "revision": "6be96f0a4cd1e4608bbec919deca0ba6"
  },
  {
    "url": "img/sprites/item-redlightbow.png",
    "revision": "76d0fe11a78923fb02dfc36fef727cbc"
  },
  {
    "url": "img/sprites/item-redlightsaber.png",
    "revision": "937e7c12e40dbfe0faced10c31040412"
  },
  {
    "url": "img/sprites/item-redmetalbow.png",
    "revision": "f2657db1220c27e2c25cb2551475c596"
  },
  {
    "url": "img/sprites/item-redmetalsword.png",
    "revision": "0384821841d9ab2d86003cdb973ef6c5"
  },
  {
    "url": "img/sprites/item-redsickle.png",
    "revision": "d3d6902b8dac201c2de073968f37d8f9"
  },
  {
    "url": "img/sprites/item-redsicklebow.png",
    "revision": "5368d8fa7feb3a42767532499756f0ae"
  },
  {
    "url": "img/sprites/item-redsword.png",
    "revision": "9b1435c73eb2d3eb70d8c63e7c985e23"
  },
  {
    "url": "img/sprites/item-redwingarcherarmor.png",
    "revision": "89babe0c22a61a71aa5cb6a6ae6eb67f"
  },
  {
    "url": "img/sprites/item-redwingarmor.png",
    "revision": "0aa14348da3d62c6999c3403c8d7da01"
  },
  {
    "url": "img/sprites/item-regionarmor.png",
    "revision": "ef4b0f76e42cc71d5ce5f68dd70d6c1f"
  },
  {
    "url": "img/sprites/item-ring1.png",
    "revision": "f9fd65ee29dee114b1172d341b80378a"
  },
  {
    "url": "img/sprites/item-robocoparmor.png",
    "revision": "28ea9c8f9fd2ddd276cdeb47d5ec13ac"
  },
  {
    "url": "img/sprites/item-rock.png",
    "revision": "a3e6c9ee9ed21b00ea93ff0dc371d526"
  },
  {
    "url": "img/sprites/item-rose.png",
    "revision": "0db672d6258d78e5fe29df37a3884c24"
  },
  {
    "url": "img/sprites/item-rosebow.png",
    "revision": "dffc0e68a93c89f160d4f27cc06f3403"
  },
  {
    "url": "img/sprites/item-royalazalea.png",
    "revision": "a8a317e56c5ad92c026d5b71886e78f1"
  },
  {
    "url": "img/sprites/item-rubyring.png",
    "revision": "12cf551a53bf7f3326e882089cc435b3"
  },
  {
    "url": "img/sprites/item-rudolfarmor.png",
    "revision": "1417e62f96cd0af61596a241119f3bcb"
  },
  {
    "url": "img/sprites/item-sapphirering.png",
    "revision": "17e0ad239bd81141fb5c832b6a4e89b1"
  },
  {
    "url": "img/sprites/item-schooluniform.png",
    "revision": "8c7406f317b4f69c1e57ef6037991869"
  },
  {
    "url": "img/sprites/item-scimitar.png",
    "revision": "9de509b5a52fedd617aeec7f7c7e7f39"
  },
  {
    "url": "img/sprites/item-seadragonarmor.png",
    "revision": "87f1ab8002f183cea56de0b2ad7b0809"
  },
  {
    "url": "img/sprites/item-seahorsebow.png",
    "revision": "aeed63418c2f8b511db9a077d7323566"
  },
  {
    "url": "img/sprites/item-searage.png",
    "revision": "60d61f0124f7e2e71dab14b19d34dd1c"
  },
  {
    "url": "img/sprites/item-seed.png",
    "revision": "7936d6b94b606a26aff315d7d68fbee0"
  },
  {
    "url": "img/sprites/item-shadowregionarmor.png",
    "revision": "bc8b2aeb698a46304546a85166d7ecef"
  },
  {
    "url": "img/sprites/item-shardt1.png",
    "revision": "13c67a97c89789e65b63562839095e77"
  },
  {
    "url": "img/sprites/item-shardt2.png",
    "revision": "b419c8a66768e198a1394bb2fddc5baf"
  },
  {
    "url": "img/sprites/item-shardt3.png",
    "revision": "0d9437920ebbc4ff81b49851f3cc14b4"
  },
  {
    "url": "img/sprites/item-shardt4.png",
    "revision": "3984a5fa897716ac250ad05c8d1a4a82"
  },
  {
    "url": "img/sprites/item-shardt5.png",
    "revision": "66906f0882e628ca127d375aabc782a9"
  },
  {
    "url": "img/sprites/item-sickle.png",
    "revision": "9ec7905f878ac40cdc65e8b5082c488f"
  },
  {
    "url": "img/sprites/item-sicklebow.png",
    "revision": "7d6160f1248998d31b6dfeae2841ea1b"
  },
  {
    "url": "img/sprites/item-sidesword.png",
    "revision": "5617fb365d8199682357e005fc0493c1"
  },
  {
    "url": "img/sprites/item-skylightbow.png",
    "revision": "f01d8c517c6c28af95871794348eebab"
  },
  {
    "url": "img/sprites/item-skylightsaber.png",
    "revision": "7ff2d414e26d02df8dfea83c6adff3ec"
  },
  {
    "url": "img/sprites/item-snowfoxarcherarmor.png",
    "revision": "c745fe985c0843cf9dfbe5e704e3ae55"
  },
  {
    "url": "img/sprites/item-snowfoxarmor.png",
    "revision": "04a6dd6072ab4b2ff25ddb0eac5d599f"
  },
  {
    "url": "img/sprites/item-snowmanarmor.png",
    "revision": "678a6bcf28c4de12a0a0c34c18fc629f"
  },
  {
    "url": "img/sprites/item-snowpotion.png",
    "revision": "5b77c9fe3e352b4ddbc79e0f980f4e39"
  },
  {
    "url": "img/sprites/item-spear.png",
    "revision": "316990bc6da5cd71cb0dc4f5c9d99fa9"
  },
  {
    "url": "img/sprites/item-spiritring.png",
    "revision": "3049c6b3dc8f1ad7b2275dff327eda7b"
  },
  {
    "url": "img/sprites/item-sproutring.png",
    "revision": "3ccb2b764b1950b6a2977a19c116c91e"
  },
  {
    "url": "img/sprites/item-squeakyhammer.png",
    "revision": "6d10a8ebd2dbf6b71cd1a04ab47596f2"
  },
  {
    "url": "img/sprites/item-squidarmor.png",
    "revision": "5a941e35dd1cc291b207758fe68a06d3"
  },
  {
    "url": "img/sprites/item-sword1.png",
    "revision": "8fdc6440583be899a5fa456dc17f434e"
  },
  {
    "url": "img/sprites/item-sword2.png",
    "revision": "a6b534e5f6449a99b4928b759b921c42"
  },
  {
    "url": "img/sprites/item-taekwondo.png",
    "revision": "6ed254831753807a28159178cd072a85"
  },
  {
    "url": "img/sprites/item-tamagotchiring.png",
    "revision": "064db93fddcd2806e1625cc11686db4b"
  },
  {
    "url": "img/sprites/item-thiefarmor.png",
    "revision": "142ab39bb7072154c79e7513a45517d6"
  },
  {
    "url": "img/sprites/item-tigerarmor.png",
    "revision": "2517df1ac1584a0b9386cbb5729c13f4"
  },
  {
    "url": "img/sprites/item-topazring.png",
    "revision": "51759dfe116e6b076fa1d1753fac16b0"
  },
  {
    "url": "img/sprites/item-trident.png",
    "revision": "a0001f2cc3585658232f19d7ab288e65"
  },
  {
    "url": "img/sprites/item-typhoon.png",
    "revision": "11087ba6af0857890fa53d1cd221491a"
  },
  {
    "url": "img/sprites/item-violetbow.png",
    "revision": "fe08a4567ac0efec3d01c22fd7a3f623"
  },
  {
    "url": "img/sprites/item-watermelon.png",
    "revision": "f9fc51f4ecaeacbe702a5ce242cda5b6"
  },
  {
    "url": "img/sprites/item-watermelonbow.png",
    "revision": "fd50b7683a6d4c256925aba014a99483"
  },
  {
    "url": "img/sprites/item-weaponblade.png",
    "revision": "ad524aa5fb76d1e23c88e6d7720c1c74"
  },
  {
    "url": "img/sprites/item-weaponcommon.png",
    "revision": "bb428c8dd669c8806180ea753a3b82fb"
  },
  {
    "url": "img/sprites/item-weaponhilt.png",
    "revision": "775b0a3ee5529596c3b490af42e1b91f"
  },
  {
    "url": "img/sprites/item-weaponrare.png",
    "revision": "df00ff2f94e8c0b21fa7418e356873df"
  },
  {
    "url": "img/sprites/item-weaponuncommon.png",
    "revision": "75656f8dc0ae342154d493eeb5be9ec2"
  },
  {
    "url": "img/sprites/item-weastaff.png",
    "revision": "a99b7459607c5f9b775a3e0ee51e7592"
  },
  {
    "url": "img/sprites/item-whip.png",
    "revision": "b6646c3bfb8559b180203320d4fef83a"
  },
  {
    "url": "img/sprites/item-whitearcherarmor.png",
    "revision": "f0058403800164336852259966ff87e9"
  },
  {
    "url": "img/sprites/item-whitearmor.png",
    "revision": "25209074f151387cb83401c3f42a3874"
  },
  {
    "url": "img/sprites/item-wizardrobe.png",
    "revision": "8c1517e7e85c6bfe782fc0d1ab23277e"
  },
  {
    "url": "img/sprites/item-wolfarcherarmor.png",
    "revision": "ef71c29ab003f8a3144f47e54e050a80"
  },
  {
    "url": "img/sprites/item-wolfarmor.png",
    "revision": "beeecb81755aeaa8ceada1215dcfc53f"
  },
  {
    "url": "img/sprites/item-wood.png",
    "revision": "ed0cc54516280dbc4f8a2cd385afd3c9"
  },
  {
    "url": "img/sprites/item-woodenbow.png",
    "revision": "90d80a20f03159305f2462d786a58001"
  },
  {
    "url": "img/sprites/jirisanmoonbear.png",
    "revision": "eec634dd9e63b4dafeb407e1fff1e47d"
  },
  {
    "url": "img/sprites/justicebow.png",
    "revision": "2cae1d86bc0db30ba292f8f839ad755f"
  },
  {
    "url": "img/sprites/justicehammer.png",
    "revision": "3e90d014c16957469ac9ac7505ceb7a8"
  },
  {
    "url": "img/sprites/kaonashi.png",
    "revision": "2bcc527cf865c593bda55276802409a8"
  },
  {
    "url": "img/sprites/king.png",
    "revision": "704a2cec449d7d1ed831f15d3f5862b8"
  },
  {
    "url": "img/sprites/lavanpc.png",
    "revision": "ff26600f76cbfd14f99aa48d324d6dd2"
  },
  {
    "url": "img/sprites/leatherarcherarmor.png",
    "revision": "0bce7ada6db1570c8ef26f0466a6c1f4"
  },
  {
    "url": "img/sprites/leatherarmor.png",
    "revision": "bc1dc32e7d3ba35b6fa0695f86d39d96"
  },
  {
    "url": "img/sprites/legolasarmor.png",
    "revision": "fdfada973c8cd44bef3bcd97a48bad8b"
  },
  {
    "url": "img/sprites/lightningguardian.png",
    "revision": "ed7be5223850f8c3b6dc38ddccb3e544"
  },
  {
    "url": "img/sprites/livingarmor.png",
    "revision": "1bf263242b1723f8cfdf327996620c0b"
  },
  {
    "url": "img/sprites/login.jpg",
    "revision": "62047a94736525ae942a4973a8f1428d"
  },
  {
    "url": "img/sprites/loot.png",
    "revision": "eda1a53724f73d41d79ed16a8d394ae7"
  },
  {
    "url": "img/sprites/machete.png",
    "revision": "a6dc1e24c8895e534c2ca079ae05f98b"
  },
  {
    "url": "img/sprites/magicspear.png",
    "revision": "e9b22eab2e6e08705e43031a5bbe8d20"
  },
  {
    "url": "img/sprites/mailarcherarmor.png",
    "revision": "24a97cfde081b864dbd1530e36adef6f"
  },
  {
    "url": "img/sprites/mailarmor.png",
    "revision": "ca08b06216add6c153e5ff6d53629ff3"
  },
  {
    "url": "img/sprites/mantis.png",
    "revision": "634d584166a9e94efe01cbb6d4ee9aa4"
  },
  {
    "url": "img/sprites/marinebow.png",
    "revision": "e197e4a033303d9a62e7708d5f1e9f46"
  },
  {
    "url": "img/sprites/memme.png",
    "revision": "c622a23c868ae53af89cabba22603083"
  },
  {
    "url": "img/sprites/mermaid.png",
    "revision": "2a763c46e3505dacefe5c677d2b0ac33"
  },
  {
    "url": "img/sprites/mermaidbow.png",
    "revision": "fe64f4106ebb56b51e5d09a9b704ce29"
  },
  {
    "url": "img/sprites/mermaidnpc.png",
    "revision": "8273e7e919e139ffb7dd7b2068b8af77"
  },
  {
    "url": "img/sprites/mimic.png",
    "revision": "05050bb032e3a69fba5cb52c60e2c3a0"
  },
  {
    "url": "img/sprites/minidragon.png",
    "revision": "3280e688f064f2163bf1b09fff79f5f8"
  },
  {
    "url": "img/sprites/miniemperor.png",
    "revision": "ee3249181f74558b4a4de350ce0d45ed"
  },
  {
    "url": "img/sprites/miniiceknight.png",
    "revision": "e81097a853943681de15d016bc660cfe"
  },
  {
    "url": "img/sprites/miniknight.png",
    "revision": "fc6253e3d71d3d652049c62df35f556c"
  },
  {
    "url": "img/sprites/miniseadragon.png",
    "revision": "dc7434caee00f37d7bf815197b88e915"
  },
  {
    "url": "img/sprites/miniseadragonarmor.png",
    "revision": "86e450563f26ae38fc1b19c353dfa5a0"
  },
  {
    "url": "img/sprites/mojojojonpc.png",
    "revision": "70ed6bdd2c5b34bcc17ea75c77e4a91b"
  },
  {
    "url": "img/sprites/moleking.png",
    "revision": "1c355acc034c266cd5241944a36fb895"
  },
  {
    "url": "img/sprites/momangelnpc.png",
    "revision": "9fb70971b2675ecfa6212d95cc925863"
  },
  {
    "url": "img/sprites/moreinventorybutton.png",
    "revision": "9d2cc67c78ecd6995de9f66b08812921"
  },
  {
    "url": "img/sprites/morningstar.png",
    "revision": "c4a6054da17c1047d86ec3f97ffd2087"
  },
  {
    "url": "img/sprites/newcharacter.jpg",
    "revision": "8afbe1f5d483199f96c05915eaa89ed1"
  },
  {
    "url": "img/sprites/nightmareregion.png",
    "revision": "6f7abadb990b1e750cb952cccd690d0f"
  },
  {
    "url": "img/sprites/ninjaarmor.png",
    "revision": "08b507a4e8a7c8741973f69873fb34ee"
  },
  {
    "url": "img/sprites/nyan.png",
    "revision": "33f61437404911809dcd1e8b8bb661aa"
  },
  {
    "url": "img/sprites/octocat.png",
    "revision": "2bfe2353a614b19512a621ff631e0100"
  },
  {
    "url": "img/sprites/octopus.png",
    "revision": "48b81aa355f8c88f1411f2036eceee58"
  },
  {
    "url": "img/sprites/oddeyecat.png",
    "revision": "4a5bf59e1821d92b51abe6e32af8e7f0"
  },
  {
    "url": "img/sprites/ogre.png",
    "revision": "a355eacf2e83abd40f32c75dcb55ccc7"
  },
  {
    "url": "img/sprites/ogrelord.png",
    "revision": "ad7e4295d51801d7aa81c7da26f93f31"
  },
  {
    "url": "img/sprites/oldogre.png",
    "revision": "3f03b83f98a56fe917e73f96ffd26cc1"
  },
  {
    "url": "img/sprites/orc.png",
    "revision": "be63fae2a48e02a758bf4443c1d54d25"
  },
  {
    "url": "img/sprites/paewoldo.png",
    "revision": "4ddf9afac38273106c18b31b266527cc"
  },
  {
    "url": "img/sprites/pain.png",
    "revision": "7d529481cbb14da2cd4398c6ac53fd12"
  },
  {
    "url": "img/sprites/paladinarmor.png",
    "revision": "6f6c123518a28e579ba46fe913f3ecff"
  },
  {
    "url": "img/sprites/penguin.png",
    "revision": "171e1b3c29f249a2ae0519cab2388e28"
  },
  {
    "url": "img/sprites/pickle.png",
    "revision": "918c51871c500364895a36298eca935b"
  },
  {
    "url": "img/sprites/pierrot.png",
    "revision": "8d64cc7a9261f72bca2e77203d6ba453"
  },
  {
    "url": "img/sprites/pinkcockroacharmor.png",
    "revision": "5bc88259c7faca5c309f29adf8641509"
  },
  {
    "url": "img/sprites/pinkelf.png",
    "revision": "b4a94ccc43ae0aa367d7cd36aac8a3d1"
  },
  {
    "url": "img/sprites/pinksword.png",
    "revision": "f2c3a5205268b2895b45fbb2b71def1a"
  },
  {
    "url": "img/sprites/piratearcherarmor.png",
    "revision": "a43fc5ec0b0f0c74d8e911d4e756ad73"
  },
  {
    "url": "img/sprites/piratecaptain.png",
    "revision": "457a85a4446b921b79b64acf0753a0d3"
  },
  {
    "url": "img/sprites/pirategirlnpc.png",
    "revision": "5789250c64250d613ea1498a289f6402"
  },
  {
    "url": "img/sprites/pirateking.png",
    "revision": "ffbb2808d39e55bd5802de9e37dd0a7a"
  },
  {
    "url": "img/sprites/pirateskeleton.png",
    "revision": "57c67dd8910a172a7c02c73185a6ad54"
  },
  {
    "url": "img/sprites/plasticbow.png",
    "revision": "45a3d5d84d53bf5f6a73ff8b656e0a77"
  },
  {
    "url": "img/sprites/platearcherarmor.png",
    "revision": "48ce4de578db4392a618c30143f924b6"
  },
  {
    "url": "img/sprites/platearmor.png",
    "revision": "dc17eda487e9533869e728e54d04e04e"
  },
  {
    "url": "img/sprites/plunger.png",
    "revision": "3eac98c5c80a63c8539669b8dfae10f0"
  },
  {
    "url": "img/sprites/pointer.png",
    "revision": "e4ef900d425e0f956db3fedee91a29ff"
  },
  {
    "url": "img/sprites/poisonspider.png",
    "revision": "b02e7253b235ee7209c2ce4a8bc24daf"
  },
  {
    "url": "img/sprites/portalarmor.png",
    "revision": "0b28d7655f5d3c8b89cdd3dd187cb128"
  },
  {
    "url": "img/sprites/powerarmour.png",
    "revision": "896cc9f8599734d2fbe08e64d7f1cc2c"
  },
  {
    "url": "img/sprites/powersword.png",
    "revision": "810b280a2a920f8bb6335b940711a3fb"
  },
  {
    "url": "img/sprites/preta.png",
    "revision": "9526dabdb9ff2b3642a966c10331bd9f"
  },
  {
    "url": "img/sprites/priest.png",
    "revision": "0c0ece20ced6cec891b80478413fbb7b"
  },
  {
    "url": "img/sprites/projectile-boulder.png",
    "revision": "25c9ec2f2a05f06e86bd6552e224dc8c"
  },
  {
    "url": "img/sprites/projectile-fireball.png",
    "revision": "04ead0cd8efd74c94683a80100f47e78"
  },
  {
    "url": "img/sprites/projectile-iceball.png",
    "revision": "c7d215091a45e33799861cc9bf458768"
  },
  {
    "url": "img/sprites/projectile-none.png",
    "revision": "ea3c1bb946d3cb8843b2969ad68ff6d3"
  },
  {
    "url": "img/sprites/projectile-pinearrow.png",
    "revision": "a05702435c334a7a6344c8ccc7c9714d"
  },
  {
    "url": "img/sprites/projectile-terror.png",
    "revision": "9f324e1c8f5581a314247bc811878720"
  },
  {
    "url": "img/sprites/projectile-tornado.png",
    "revision": "adeed1e745f8a7b4484dcf1ad4c3c643"
  },
  {
    "url": "img/sprites/provocationeffect.png",
    "revision": "dcd6dec4763ce1054f8fb1ed316affda"
  },
  {
    "url": "img/sprites/purplecloudkallege.png",
    "revision": "98f7d8afc644f3beb7e7ccce003c11dd"
  },
  {
    "url": "img/sprites/purplepreta.png",
    "revision": "bb068c3ce238508c68a3d8e3261f2ebd"
  },
  {
    "url": "img/sprites/queenant.png",
    "revision": "0fecd09730bb3c8aa840394c9636aa48"
  },
  {
    "url": "img/sprites/queenspider.png",
    "revision": "a361099262f8c7585443354f292f9cfc"
  },
  {
    "url": "img/sprites/rabbitarmor.png",
    "revision": "92f3bb29da708c5d32ac4b3d42f7e561"
  },
  {
    "url": "img/sprites/radisharmor.png",
    "revision": "dca6377d9eacf47c5800ffa127aed43a"
  },
  {
    "url": "img/sprites/rainbowapro.png",
    "revision": "5ec62058c867f0ebe58b4c1be33061f3"
  },
  {
    "url": "img/sprites/rainbowsword.png",
    "revision": "3df1cd4bca93332d92d33a1f2a78cdad"
  },
  {
    "url": "img/sprites/rat.png",
    "revision": "2d59ae1d2c7c642f112c722e8b88d4b9"
  },
  {
    "url": "img/sprites/ratarcherarmor.png",
    "revision": "b800b7fef2155d2b52924777159985e7"
  },
  {
    "url": "img/sprites/ratarmor.png",
    "revision": "7e498214adab135e930e720c5d02fc86"
  },
  {
    "url": "img/sprites/redarcherarmor.png",
    "revision": "a504964f04a9d42c47477abadc19923e"
  },
  {
    "url": "img/sprites/redarmor.png",
    "revision": "106d55c6b8ef74c42b7f00c5a5f9151f"
  },
  {
    "url": "img/sprites/redbikinigirlnpc.png",
    "revision": "809088fd13aafe0e72ae4f13991467c7"
  },
  {
    "url": "img/sprites/redbow.png",
    "revision": "bdc3ef0d95623b088304b948c4a9b1ac"
  },
  {
    "url": "img/sprites/redcockroach.png",
    "revision": "7a225d81ae14bef390b31a995cbc2936"
  },
  {
    "url": "img/sprites/reddamboarmor.png",
    "revision": "eb35987f6871e4a5ec43bc3b94c36b6e"
  },
  {
    "url": "img/sprites/redelf.png",
    "revision": "bc4e489a7dc54076c36e1baa28b02661"
  },
  {
    "url": "img/sprites/redenelbow.png",
    "revision": "4dc5a31600c198cd6b31a0e221c1cf2c"
  },
  {
    "url": "img/sprites/redfish.png",
    "revision": "124141eed7b4db9485d386a1702f17cc"
  },
  {
    "url": "img/sprites/redguard.png",
    "revision": "5d4f148525b1e77320cb1167d2ce132e"
  },
  {
    "url": "img/sprites/redguardarcherarmor.png",
    "revision": "cf2e9b06ee394a077d811683ddaf6e22"
  },
  {
    "url": "img/sprites/redguardarmor.png",
    "revision": "14917739b43c3c0c143dd5332fa77091"
  },
  {
    "url": "img/sprites/redlightbow.png",
    "revision": "a98e45379e0052c36f3a6501a18a337b"
  },
  {
    "url": "img/sprites/redlightsaber.png",
    "revision": "236b437bbb2640a837f601ff0b36c455"
  },
  {
    "url": "img/sprites/redmetalbow.png",
    "revision": "5feff88977215b6c67adafb92110a883"
  },
  {
    "url": "img/sprites/redmetalsword.png",
    "revision": "099eddf68106e0d1e614dcf4f337a904"
  },
  {
    "url": "img/sprites/redmouse.png",
    "revision": "875af3ff188ee0adcdbbd45ee2b294ce"
  },
  {
    "url": "img/sprites/redpirateskeleton.png",
    "revision": "f28d2b15f6523cd27b0aa9d6f6f6f0f2"
  },
  {
    "url": "img/sprites/redsickle.png",
    "revision": "46675111821a758b4706288d2b4c6d71"
  },
  {
    "url": "img/sprites/redsicklebow.png",
    "revision": "33528a00fdee37055c0a879f4bf686ef"
  },
  {
    "url": "img/sprites/redstoremannpc.png",
    "revision": "aa108b410bcabace378e70a7bb9976ae"
  },
  {
    "url": "img/sprites/redsword.png",
    "revision": "c438deb1afb027020015a31c15f23697"
  },
  {
    "url": "img/sprites/redwingarcherarmor.png",
    "revision": "849233f97f13a6786c131486b16498c1"
  },
  {
    "url": "img/sprites/redwingarmor.png",
    "revision": "f852af172b09dddc6e1afc530beb84b2"
  },
  {
    "url": "img/sprites/regionarmor.png",
    "revision": "8c393f5566c972b7b6c9a7ff8e7002e9"
  },
  {
    "url": "img/sprites/regionhenchman.png",
    "revision": "6ed8372257a750d842a8d5df21e5d188"
  },
  {
    "url": "img/sprites/rhaphidophoridae.png",
    "revision": "85543fadb1573ade164bc514be3bccd7"
  },
  {
    "url": "img/sprites/rick.png",
    "revision": "3d6cb8a2d9c35ce4807e30969e4a46ea"
  },
  {
    "url": "img/sprites/robocoparmor.png",
    "revision": "7cad4f33f0ea95483770fd14c42e4b44"
  },
  {
    "url": "img/sprites/rose.png",
    "revision": "4358ececf557bcf4ba04506b14287fdb"
  },
  {
    "url": "img/sprites/rosebow.png",
    "revision": "ec00aa4e8a138c9c7675fab83f07ada9"
  },
  {
    "url": "img/sprites/rudolf.png",
    "revision": "08a4d7fcac671328bab6aa04f32f1e0d"
  },
  {
    "url": "img/sprites/rudolfarmor.png",
    "revision": "cc3f717fb6e4c0759809dbef75e5c4c1"
  },
  {
    "url": "img/sprites/santa.png",
    "revision": "58a41c78b4cc8b63e12adea8e541107e"
  },
  {
    "url": "img/sprites/santaelf.png",
    "revision": "24c0433b99f916e57fad6b3ad86138ae"
  },
  {
    "url": "img/sprites/schooluniform.png",
    "revision": "1eef47f8b2d3140a57b295852969392b"
  },
  {
    "url": "img/sprites/scientist.png",
    "revision": "70bcbe983014bf93579f35bd46554a5d"
  },
  {
    "url": "img/sprites/scimitar.png",
    "revision": "74c141a0e794b3d657527d4cebde5a63"
  },
  {
    "url": "img/sprites/scorpion.png",
    "revision": "9284b092468c68d6f7ebbcf5db566cac"
  },
  {
    "url": "img/sprites/seadragon.png",
    "revision": "e044eb26d51a26373e9a044e5a2f1bda"
  },
  {
    "url": "img/sprites/seadragonarmor.png",
    "revision": "291735c4acd02e6bd2c6ef25ad870542"
  },
  {
    "url": "img/sprites/seahorsebow.png",
    "revision": "09ed12153b07c5a5e18b47cd719b8dcd"
  },
  {
    "url": "img/sprites/searage.png",
    "revision": "db52ea72c25141462cd3ec090ee17edf"
  },
  {
    "url": "img/sprites/secondsonangelnpc.png",
    "revision": "79ab7021078274f70ea27843a5efb56b"
  },
  {
    "url": "img/sprites/shadow16.png",
    "revision": "00a9a416bb92a8f768aaee0548c6b866"
  },
  {
    "url": "img/sprites/shadowregion.png",
    "revision": "24751888543f5996d856095470081106"
  },
  {
    "url": "img/sprites/shadowregionarmor.png",
    "revision": "3178e3047c7c403cb986534ee846c873"
  },
  {
    "url": "img/sprites/shepherdboy.png",
    "revision": "476a6203837c0046c47aae83d3361648"
  },
  {
    "url": "img/sprites/shieldbenef.png",
    "revision": "17a41e038eeb4720e6f67ac9a5a54bdb"
  },
  {
    "url": "img/sprites/sickle.png",
    "revision": "99297dca4852880ed2e64edb42717dc1"
  },
  {
    "url": "img/sprites/sicklebow.png",
    "revision": "1119a6090b871439ccce3c87bba95b2f"
  },
  {
    "url": "img/sprites/sidesword.png",
    "revision": "a668e44b324734eeff0ea02a85b6c1cd"
  },
  {
    "url": "img/sprites/silvermedal.png",
    "revision": "7c35305d8fc02fda2cbba87ef1113e23"
  },
  {
    "url": "img/sprites/skeleton.png",
    "revision": "27e2c3f7020fffb239962039a2641bfa"
  },
  {
    "url": "img/sprites/skeleton2.png",
    "revision": "52e2c8e693ffe7ec35ff271056237773"
  },
  {
    "url": "img/sprites/skeletonking.png",
    "revision": "6696bfd8036892dd1900dabb53f9f8e0"
  },
  {
    "url": "img/sprites/skilllevel.png",
    "revision": "68dca3e8f22a2ce6c0541fc826ff513e"
  },
  {
    "url": "img/sprites/skydinosaur.png",
    "revision": "2fd0871c35a27466f4698c956284d871"
  },
  {
    "url": "img/sprites/skyelf.png",
    "revision": "c21ed7b37d3ae93a10565d3491d56f90"
  },
  {
    "url": "img/sprites/skylightbow.png",
    "revision": "d73f3d7b49a93e57981deacf88a6cb56"
  },
  {
    "url": "img/sprites/skylightsaber.png",
    "revision": "80285499e128127fbdf9066bf8674365"
  },
  {
    "url": "img/sprites/slime.png",
    "revision": "7eedc19acc58fdf7cc4839c8d09bd33d"
  },
  {
    "url": "img/sprites/smalldevil.png",
    "revision": "0112195a6b943f1e139baee2091f78e6"
  },
  {
    "url": "img/sprites/snek.png",
    "revision": "e03a246a3c23c81a54ef568c4347f18b"
  },
  {
    "url": "img/sprites/snowelf.png",
    "revision": "d4eb771302c5c712ee09d886c879cc2d"
  },
  {
    "url": "img/sprites/snowfoxarcherarmor.png",
    "revision": "edaff1ffd3586d718676590394e7e531"
  },
  {
    "url": "img/sprites/snowfoxarmor.png",
    "revision": "a484b5c6ea2d0f46a4f5869ec581650f"
  },
  {
    "url": "img/sprites/snowlady.png",
    "revision": "45d440902635286c8ff5bee491dae387"
  },
  {
    "url": "img/sprites/snowman.png",
    "revision": "5e50e32927c66aa79e2c1997b5ac6757"
  },
  {
    "url": "img/sprites/snowmanarmor.png",
    "revision": "2f8aa496fb9edf67690b7a36be326d43"
  },
  {
    "url": "img/sprites/snowrabbit.png",
    "revision": "653d4688319a008a1e650b21d43ecda2"
  },
  {
    "url": "img/sprites/snowshepherdboy.png",
    "revision": "b4b049795a0f0543808658efca3d5b08"
  },
  {
    "url": "img/sprites/snowwolf.png",
    "revision": "0d3b2fb64ced7aed311a1f4d899c478c"
  },
  {
    "url": "img/sprites/soldier.png",
    "revision": "03330c47cfcaf9a1559f8bdb8298110c"
  },
  {
    "url": "img/sprites/soldierant.png",
    "revision": "b3c2940a675a7e849daa5620239c899a"
  },
  {
    "url": "img/sprites/sorcerer.png",
    "revision": "925c7fef239430c572c554c2b813f3f6"
  },
  {
    "url": "img/sprites/soundbutton.png",
    "revision": "786bf720e296f96c6d58bb74d2f9fb64"
  },
  {
    "url": "img/sprites/soybeanbug.png",
    "revision": "f9753305fef0e7e730fb4a7f45820532"
  },
  {
    "url": "img/sprites/sparks.png",
    "revision": "976162754d8a932a91128edc0bae3f28"
  },
  {
    "url": "img/sprites/spear.png",
    "revision": "4792ea3bbd10a547782d4fddcf751cea"
  },
  {
    "url": "img/sprites/spectre.png",
    "revision": "5d67713c09c7f686d7f49ed82343b7b5"
  },
  {
    "url": "img/sprites/spell.png",
    "revision": "6c0dbcb0d598cb3da815200f87836622"
  },
  {
    "url": "img/sprites/spider.png",
    "revision": "0d694def3758f16c53be3f3831bbefb0"
  },
  {
    "url": "img/sprites/sponge.png",
    "revision": "cbdab6264df453d48301e2d7181f4222"
  },
  {
    "url": "img/sprites/squeakyhammer.png",
    "revision": "9c3f65db5d2f3fa009ea2060b524795f"
  },
  {
    "url": "img/sprites/squid.png",
    "revision": "b0e3727452cfb0f48f5e31cecfdd36b8"
  },
  {
    "url": "img/sprites/squidarmor.png",
    "revision": "eceaec22ba15fb3c71dd02172a491a35"
  },
  {
    "url": "img/sprites/squirrel.png",
    "revision": "59746f9e1d69912e6287eaf0170dd9d3"
  },
  {
    "url": "img/sprites/stuneffect.png",
    "revision": "4c51a709cf490d961654ed2a0831b8ca"
  },
  {
    "url": "img/sprites/suicideghost.png",
    "revision": "4673f878af531f27be30d4b2ad7903c7"
  },
  {
    "url": "img/sprites/supercateffect.png",
    "revision": "bff763d3c5bc62fe3fb4352e7ed7a247"
  },
  {
    "url": "img/sprites/superiorangelnpc.png",
    "revision": "c50c6271895d580991e88961029f6d3b"
  },
  {
    "url": "img/sprites/sword.png",
    "revision": "32a775a6168626221aff7767f65c24b2"
  },
  {
    "url": "img/sprites/sword1.png",
    "revision": "b57af4e219caaa2b9758ba778a1cc2bc"
  },
  {
    "url": "img/sprites/sword2.png",
    "revision": "0f6acc6874b08ce7cebea565fa73b840"
  },
  {
    "url": "img/sprites/taekwondo.png",
    "revision": "cdd16cdb172b4fe9aa1febbaedd6f645"
  },
  {
    "url": "img/sprites/talk.png",
    "revision": "9dc3add8132e79d9300aae9054b670a1"
  },
  {
    "url": "img/sprites/target.png",
    "revision": "f8fd02695cb6486aafcd5f8c5f92e1c3"
  },
  {
    "url": "img/sprites/thiefarmor.png",
    "revision": "e7250f80e4dbcd8ea2d0b29be4f8adc4"
  },
  {
    "url": "img/sprites/tigerarmor.png",
    "revision": "f0982d4542abecdc5e8a3ed3cc5a6d9e"
  },
  {
    "url": "img/sprites/trident.png",
    "revision": "6af0ae3f56bf861b48f28a49496a82ce"
  },
  {
    "url": "img/sprites/typhoon.png",
    "revision": "48fcb3d3cc8bd2607a3f6bb6a0d2fd0a"
  },
  {
    "url": "img/sprites/vampire.png",
    "revision": "a28a4a6f6201d2ac70d419507bfa3cea"
  },
  {
    "url": "img/sprites/vendingmachine.png",
    "revision": "a7f728898e389dbdaba1de87743db0b5"
  },
  {
    "url": "img/sprites/villagegirl.png",
    "revision": "95046e67090dbf8f092384cb41d5d762"
  },
  {
    "url": "img/sprites/villager.png",
    "revision": "ea8ff5e5dba8ebf5f90ee24edb32b778"
  },
  {
    "url": "img/sprites/violetbow.png",
    "revision": "95febd3af77fcd8b346fb3c7401fe05c"
  },
  {
    "url": "img/sprites/vulture.png",
    "revision": "825d3608ae41f09b6565334682e5a44f"
  },
  {
    "url": "img/sprites/watermelonbow.png",
    "revision": "865411effb56d95503e2cc44122beee7"
  },
  {
    "url": "img/sprites/weastaff.png",
    "revision": "bb3e3000b4d24a85b27eb9023b8299ab"
  },
  {
    "url": "img/sprites/whip.png",
    "revision": "a9ffb3a565edc3b0b395993c2f5809a3"
  },
  {
    "url": "img/sprites/whitearcherarmor.png",
    "revision": "ace89e2f5968bd99d1006777d42725a3"
  },
  {
    "url": "img/sprites/whitearmor.png",
    "revision": "8f82a62c913578de83d370d175366333"
  },
  {
    "url": "img/sprites/whitebear.png",
    "revision": "4777318de4677fc014600c365b0b8f74"
  },
  {
    "url": "img/sprites/whitemouse.png",
    "revision": "ee9021aeb803dc0032be53222b21f3aa"
  },
  {
    "url": "img/sprites/whitetiger.png",
    "revision": "6cee143c17217fd657ef2754da5b9d23"
  },
  {
    "url": "img/sprites/windguardian.png",
    "revision": "c33ac169dc6c27380598cfac6b006d86"
  },
  {
    "url": "img/sprites/wizard.png",
    "revision": "74e1b08d57ae05a8d57a95707370d4e4"
  },
  {
    "url": "img/sprites/wizardrobe.png",
    "revision": "0cffa1da14d2cd5a26e785eddfa84708"
  },
  {
    "url": "img/sprites/wolf.png",
    "revision": "2fd33bc81a950165fe449ca7da4d976f"
  },
  {
    "url": "img/sprites/wolfarcherarmor.png",
    "revision": "f35704e1ea1ffba686a64443d4b90bac"
  },
  {
    "url": "img/sprites/wolfarmor.png",
    "revision": "b045d6ec3acdc2e8d1ddcfe0a338c81d"
  },
  {
    "url": "img/sprites/wood.png",
    "revision": "2069fec9506e5b41feac4eb834d85a5a"
  },
  {
    "url": "img/sprites/wood2.png",
    "revision": "aff44293a0561de2226cd7975a924567"
  },
  {
    "url": "img/sprites/wood3.png",
    "revision": "24eac44c43faf1f799eb2e5cc108e73f"
  },
  {
    "url": "img/sprites/woodenbow.png",
    "revision": "496429fb4d617ec6bc34e27310ab442f"
  },
  {
    "url": "img/sprites/yellowbat.png",
    "revision": "4d0ddc64938699c60a078b75de0787b2"
  },
  {
    "url": "img/sprites/yellowfish.png",
    "revision": "94d38e38946c630416b57d73190505d5"
  },
  {
    "url": "img/sprites/yellowmouse.png",
    "revision": "1f98978d99323dc02e0177efe6a0008a"
  },
  {
    "url": "img/sprites/yellowpreta.png",
    "revision": "18cadc1419b119d0370f9540973f64d7"
  },
  {
    "url": "img/sprites/zombie.png",
    "revision": "646194048e5462dd140c63248760e971"
  },
  {
    "url": "img/sprites/zombiegf.png",
    "revision": "3422ec62a3271e07b9a7283f18fc6501"
  },
  {
    "url": "img/thingy.png",
    "revision": "865ec535f921709b68d62654abe5993e"
  },
  {
    "url": "img/tilesets/tilesheet.png",
    "revision": "3a600f069fc12025e1b77c9ab392b3b5"
  },
  {
    "url": "index.html",
    "revision": "0c48403a8e17b18ab44e2937cdd160e2"
  },
  {
    "url": "js/app.js",
    "revision": "c8d0710b40f23f8d77966cda54fabac3"
  },
  {
    "url": "js/build.js",
    "revision": "6587eadd64e7b7d2fedad92efd0f0ea4"
  },
  {
    "url": "js/controllers/audio.js",
    "revision": "557e595feffd9b1e823b0ceb8625b4e9"
  },
  {
    "url": "js/controllers/bubble.js",
    "revision": "99eeaff40451a2c0e85618da1f5d2778"
  },
  {
    "url": "js/controllers/chat.js",
    "revision": "9ce0246a868aa0198234cb43959ad744"
  },
  {
    "url": "js/controllers/entities.js",
    "revision": "79de4f5b97de31760da929b3608bca2d"
  },
  {
    "url": "js/controllers/info.js",
    "revision": "fbf970f16c65fefd39f0a42d1cd96166"
  },
  {
    "url": "js/controllers/input.js",
    "revision": "a529dfe389b477b91d155b7dae9eed9d"
  },
  {
    "url": "js/controllers/interface.js",
    "revision": "bb0205c3c3b5b4e8111d62c818f212d7"
  },
  {
    "url": "js/controllers/overlay.js",
    "revision": "51e97748179bd374915d3011e5ec1efa"
  },
  {
    "url": "js/controllers/pointer.js",
    "revision": "813ee7d0577295c6a1e6b16cb8313a47"
  },
  {
    "url": "js/controllers/sprites.js",
    "revision": "49d6b3977eda7527a368ec51faf93a7b"
  },
  {
    "url": "js/controllers/zoning.js",
    "revision": "12188853593d2dbb2ac0d6457dca621a"
  },
  {
    "url": "js/entity/animation.js",
    "revision": "87384c38f8733e43fec356fcdcc34ab2"
  },
  {
    "url": "js/entity/character/character.js",
    "revision": "fbbebe0ac56804e17a929b35a3968c98"
  },
  {
    "url": "js/entity/character/mob/mob.js",
    "revision": "628938d229e2449baa6028d91084d2c1"
  },
  {
    "url": "js/entity/character/npc/npc.js",
    "revision": "881793fd9969caebd12b15639d203b50"
  },
  {
    "url": "js/entity/character/player/equipment/armour.js",
    "revision": "3f36533d5174d3151b1dcd594636f378"
  },
  {
    "url": "js/entity/character/player/equipment/boots.js",
    "revision": "f2cd8e9e3da1dcff3398cdf4ee34616d"
  },
  {
    "url": "js/entity/character/player/equipment/equipment.js",
    "revision": "2158af974491912695a8618df7f27957"
  },
  {
    "url": "js/entity/character/player/equipment/pendant.js",
    "revision": "f2cd8e9e3da1dcff3398cdf4ee34616d"
  },
  {
    "url": "js/entity/character/player/equipment/ring.js",
    "revision": "f2cd8e9e3da1dcff3398cdf4ee34616d"
  },
  {
    "url": "js/entity/character/player/equipment/weapon.js",
    "revision": "c642befe2e5c85103af1d1ee824db264"
  },
  {
    "url": "js/entity/character/player/player.js",
    "revision": "f8bb1a9d408c7de00962126c93e8d202"
  },
  {
    "url": "js/entity/character/player/playerhandler.js",
    "revision": "a9a5ec2a93434deaf586da2f9290a197"
  },
  {
    "url": "js/entity/entity.js",
    "revision": "710aaa1c890b1a79eae72323882ac0bd"
  },
  {
    "url": "js/entity/entityhandler.js",
    "revision": "21ec52b8ac6550f39cea1f342f843935"
  },
  {
    "url": "js/entity/objects/chest.js",
    "revision": "53f7f393205ed92c7b4680483fd93c09"
  },
  {
    "url": "js/entity/objects/item.js",
    "revision": "30cd8e7e8f43531fa6138e61786ddbfa"
  },
  {
    "url": "js/entity/objects/projectile.js",
    "revision": "58af7d548518db457d15dbdc794df50b"
  },
  {
    "url": "js/entity/sprite.js",
    "revision": "370f79ef1d42fd82749b50d270232fa5"
  },
  {
    "url": "js/game.js",
    "revision": "144bb4d732fa6e1cd6f96ba4afeb484a"
  },
  {
    "url": "js/interface/abilities.js",
    "revision": "58c22e60699f5506522a99413fd80783"
  },
  {
    "url": "js/interface/actions.js",
    "revision": "792af4855005b211c57172fad22b9a8e"
  },
  {
    "url": "js/interface/bank.js",
    "revision": "91de4f07f00efd46b877b36791a9f831"
  },
  {
    "url": "js/interface/container/container.js",
    "revision": "e22520dc12960681dcb904a145e229e8"
  },
  {
    "url": "js/interface/container/slot.js",
    "revision": "af3e321dc0cb577f8608f91765c2d043"
  },
  {
    "url": "js/interface/enchant.js",
    "revision": "2a29d4533051ac930e58b10fca1530b2"
  },
  {
    "url": "js/interface/header.js",
    "revision": "a95d3d31ebb12654f13ccd86114938fc"
  },
  {
    "url": "js/interface/inventory.js",
    "revision": "069abce036d24171e6761df3e585fe8f"
  },
  {
    "url": "js/interface/profile/page.js",
    "revision": "377d2a625dd053df428007341bcca550"
  },
  {
    "url": "js/interface/profile/pages/ability.js",
    "revision": "be7d6f580d5df87c2588037b79b9c6ed"
  },
  {
    "url": "js/interface/profile/pages/quest.js",
    "revision": "5bfe2169cf7198517cde33640a13ac15"
  },
  {
    "url": "js/interface/profile/pages/settings.js",
    "revision": "4ff660208cc48102d2c98b81b987cda3"
  },
  {
    "url": "js/interface/profile/pages/state.js",
    "revision": "8b7eecc6388c6db0b6de50c98c01d5b2"
  },
  {
    "url": "js/interface/profile/profile.js",
    "revision": "83ec2aec9d12af8ba94757f08e85a57b"
  },
  {
    "url": "js/interface/shop.js",
    "revision": "59db1d30ed79f8f7edfc0756775d9401"
  },
  {
    "url": "js/interface/warp.js",
    "revision": "362b90c659ef623a1b0d225137d534d6"
  },
  {
    "url": "js/lib/astar.js",
    "revision": "ce0e6b01fe9267e95ebf937141923401"
  },
  {
    "url": "js/lib/class.js",
    "revision": "e93b7d7ebcf6d326c2c98e75666ff006"
  },
  {
    "url": "js/lib/home.js",
    "revision": "e629f116782a5d8e224ed7d552deb16c"
  },
  {
    "url": "js/lib/jquery.js",
    "revision": "24f2e59beae1680f19632d9c1b89d730"
  },
  {
    "url": "js/lib/log.js",
    "revision": "45866dabc5a5534f585d294faf51ead4"
  },
  {
    "url": "js/lib/modernizr.js",
    "revision": "660981acde608032c0f1f8ce91dab7e1"
  },
  {
    "url": "js/lib/require.js",
    "revision": "0966fff938ba2a2e11b6848156fa86e2"
  },
  {
    "url": "js/lib/stacktrace.js",
    "revision": "1ec00eac30603b746a53e080053f2d9f"
  },
  {
    "url": "js/lib/underscore.min.js",
    "revision": "601dd4623a300466f529f62b73e990b2"
  },
  {
    "url": "js/main.js",
    "revision": "f4e97dea9a72b30b5c00dc0f565b9a29"
  },
  {
    "url": "js/map/map.js",
    "revision": "132ebccc541037b4f227d33790566789"
  },
  {
    "url": "js/map/mapworker.js",
    "revision": "3e93b4239f08fb9c9072312428cca5fe"
  },
  {
    "url": "js/network/connection.js",
    "revision": "f89ad84460220b19858e88fbda5a05d7"
  },
  {
    "url": "js/network/impl/teamwar.js",
    "revision": "642d0680cfd0aef490981bd0f8c40202"
  },
  {
    "url": "js/network/messages.js",
    "revision": "15eea4df6b310b56d0697e575377ca2d"
  },
  {
    "url": "js/network/packets.js",
    "revision": "a18326864e8ebfe62f7ab1c2989ef0cb"
  },
  {
    "url": "js/network/socket.js",
    "revision": "fb8dfbb64f43d395f18b2770677897d6"
  },
  {
    "url": "js/renderer/bubbles/blob.js",
    "revision": "5986c6ba547ad18df8995472b6943757"
  },
  {
    "url": "js/renderer/camera.js",
    "revision": "530f3ebca5f60460c9edc049910ac4d9"
  },
  {
    "url": "js/renderer/grids.js",
    "revision": "a6871bbbb58cdaa8061b2da3876bc83e"
  },
  {
    "url": "js/renderer/infos/countdown.js",
    "revision": "35acaef1eb2c092a66edfd939948b23e"
  },
  {
    "url": "js/renderer/infos/splat.js",
    "revision": "6cfee26093c9319bb7eb10b80a3da7a6"
  },
  {
    "url": "js/renderer/overlay.js",
    "revision": "97b88fccc82b5b42f983c169205aff28"
  },
  {
    "url": "js/renderer/pointers/pointer.js",
    "revision": "9a922f202e5a81270d36e0ceb80e0220"
  },
  {
    "url": "js/renderer/renderer.js",
    "revision": "8b7394f50b6b0d4bc3f1090e606e7a82"
  },
  {
    "url": "js/renderer/tile.js",
    "revision": "9cd5738df647fddb0d8eda3c9e288597"
  },
  {
    "url": "js/renderer/updater.js",
    "revision": "0105bb4f576697c3fe53d942188ed4fb"
  },
  {
    "url": "js/text.js",
    "revision": "130dc41fb3588a4593ce46fbe725a80e"
  },
  {
    "url": "js/utils/detect.js",
    "revision": "150c6b147a5add047b3aa2eac484be7d"
  },
  {
    "url": "js/utils/modules.js",
    "revision": "412737bd5032cdaf8c8e2cd00539d720"
  },
  {
    "url": "js/utils/pathfinder.js",
    "revision": "23a511a5062210992eea0e940d1ff46e"
  },
  {
    "url": "js/utils/queue.js",
    "revision": "44c12d4b1417002019958ff66edb6d06"
  },
  {
    "url": "js/utils/storage.js",
    "revision": "2cc14ad0ee35360f09396fa18f2f43d6"
  },
  {
    "url": "js/utils/timer.js",
    "revision": "bd93beb0f7d6d7f0c4e9c69e000c29ee"
  },
  {
    "url": "js/utils/transition.js",
    "revision": "4a94931eb8d7a899d88e6e143306e7ec"
  },
  {
    "url": "js/utils/util.js",
    "revision": "4a2178e98a5ad055f388c82504536ac6"
  },
  {
    "url": "lib/illuminated.js",
    "revision": "72ae0223710a4849af39c54299bc4ed7"
  },
  {
    "url": "lib/pwa.js",
    "revision": "a381e9b7b7d731712ad2153dac9a10e8"
  },
  {
    "url": "lib/socket.io.js",
    "revision": "c396a1221c117c4903d6281c575420a2"
  },
  {
    "url": "manifest.json",
    "revision": "0726407f74d78751653341c1f6ca280c"
  },
  {
    "url": "robots.txt",
    "revision": "fe59322badfdabe4c3f126caa609699f"
  },
  {
    "url": "sitemap.xml",
    "revision": "0cb5c74bea59445adc3dc4171907595f"
  }
].concat(self.__precacheManifest || []);
//workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/txt|xml|html|css|js|json/, new workbox.strategies.NetworkFirst({ "cacheName":"web", plugins: [new workbox.expiration.Plugin({ maxAgeSeconds: 86400, purgeOnQuotaError: false }), new workbox.cacheableResponse.Plugin({ statuses: [ 0, 200 ], headers: { 'x-test': 'true' } })] }), 'GET');
workbox.routing.registerRoute(/ico|png|gif|jpg/, new workbox.strategies.NetworkFirst({ "cacheName":"images", plugins: [new workbox.expiration.Plugin({ maxAgeSeconds: 604800, purgeOnQuotaError: false }), new workbox.cacheableResponse.Plugin({ statuses: [ 0, 200 ], headers: { 'x-test': 'true' } })] }), 'GET');
workbox.routing.registerRoute(/woff|eot|woff2|ttf|svg/, new workbox.strategies.NetworkFirst({ "cacheName":"audio", plugins: [new workbox.expiration.Plugin({ maxAgeSeconds: 604800, purgeOnQuotaError: false }), new workbox.cacheableResponse.Plugin({ statuses: [ 0, 200 ], headers: { 'x-test': 'true' } })] }), 'GET');
workbox.routing.registerRoute(/mp3/, new workbox.strategies.NetworkFirst({ "cacheName":"fonts", plugins: [new workbox.expiration.Plugin({ maxAgeSeconds: 604800, purgeOnQuotaError: false }), new workbox.cacheableResponse.Plugin({ statuses: [ 0, 200 ], headers: { 'x-test': 'true' } })] }), 'GET');
