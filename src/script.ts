// Naskah narasi "Arus yang Mengangkat" — Fisika Umum: Fluida Dinamis.
// Setiap adegan berisi baris narasi. Durasi baris dihitung otomatis dari jumlah
// suku kata (lihat timeline.ts) atau dari rekaman suara bila sudah ada,
// jadi cukup ubah teks di sini: visual, subtitle, dan musik ikut menyesuaikan.
//
// Aturan menulis teks narasi (dibaca mesin TTS):
//  - angka & simbol ditulis sebagai kata ("dua puluh meter per detik"),
//  - rumus ditulis sebagai kalimat; rumus rapi tampil di layar (komponen Formula).
// Angka sudah dicek di naskah/AUDIT.md (g = 10 m/s², ρ air = 1000 kg/m³, ρ udara ≈ 1,2 kg/m³, p_atm = 100 kPa, kecuali disebut lain).
//
// hl     : kata/frasa yang disorot pada subtitle
// pause  : jeda (detik) SETELAH baris dibacakan
// lead   : jeda (detik) sebelum baris pertama adegan
// tail   : jeda (detik) setelah baris terakhir adegan
// fixed  : durasi tetap (detik) untuk adegan tanpa narasi

export type Line = {
  text: string;
  /** Teks khusus TTS (opsional). Bila kosong, dibuat otomatis oleh src/tts.ts. */
  tts?: string;
  hl?: string[];
  pause?: number;
};

export type SceneScript = {
  id: string;
  chapter: string; // nomor bab di heading, "" untuk tanpa heading
  part?: 1 | 2 | 3; // 1 konsep & cara berpikir, 2 fluida mengalir di laboratorium kimia, 3 penerapan
  title: string;
  lines: Line[];
  lead?: number;
  tail?: number;
  fixed?: number;
  mood: 'mystery' | 'title' | 'wonder' | 'build' | 'tension' | 'bright' | 'resolve' | 'outro';
};

export const SCRIPT: SceneScript[] = [
  {
    "id": "hook",
    "chapter": "",
    "title": "Selang, kertas, dan pesawat",
    "mood": "mystery",
    "lead": 1.6,
    "tail": 1.2,
    "lines": [
      {
        "text": "Tutup sebagian ujung selang dengan jempol, dan air tiba-tiba menyembur jauh lebih jauh.",
        "hl": [
          "menyembur jauh"
        ],
        "pause": 0.7
      },
      {
        "text": "Tiup udara di antara dua lembar kertas yang tergantung. Kertasnya tidak terdorong menjauh, justru saling merapat.",
        "hl": [
          "saling merapat"
        ],
        "pause": 0.8
      },
      {
        "text": "Dan sebuah pesawat seberat tujuh puluh ton melayang di udara, ditopang oleh sesuatu yang tak terlihat.",
        "hl": [
          "tujuh puluh ton"
        ],
        "pause": 0.9
      },
      {
        "text": "Tiga kejadian ini tampak tak berhubungan.",
        "pause": 0.5
      },
      {
        "text": "Padahal semuanya diatur oleh satu gagasan yang sama:",
        "pause": 0.4
      },
      {
        "text": "ketika fluida mengalir lebih cepat, tekanannya justru turun.",
        "hl": [
          "lebih cepat",
          "tekanannya justru turun"
        ],
        "pause": 1.0
      },
      {
        "text": "Di video sebelumnya kita belajar fluida yang diam. Sekarang, fluidanya bergerak.",
        "hl": [
          "bergerak"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "title",
    "chapter": "",
    "title": "Arus yang Mengangkat",
    "mood": "title",
    "fixed": 8,
    "lines": []
  },
  {
    "id": "roadmap",
    "chapter": "",
    "title": "Peta video",
    "mood": "wonder",
    "lead": 0.8,
    "tail": 1.4,
    "lines": [
      {
        "text": "Video ini membahas fluida dinamis, yaitu fluida yang mengalir, dalam tiga bagian.",
        "hl": [
          "fluida dinamis"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian pertama, konsep dan cara berpikir: fluida ideal, garis arus, debit, kontinuitas, Bernoulli, Torricelli, gaya angkat, dan kekentalan.",
        "hl": [
          "konsep dan cara berpikir"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian kedua, fluida mengalir di laboratorium kimia: pompa vakum air, pembakar Bunsen, nebulizer, dan viskometer.",
        "hl": [
          "laboratorium kimia"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian ketiga, penerapan: pembuluh darah, kapal yang berpapasan, dan atap yang terangkat badai.",
        "hl": [
          "penerapan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "ideal",
    "chapter": "01",
    "title": "Fluida ideal & garis arus",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Aliran fluida yang nyata sangat rumit: berputar, bergolak, dan saling bergesekan.",
        "hl": [
          "sangat rumit"
        ],
        "pause": 0.7
      },
      {
        "text": "Agar bisa dipahami, fisikawan memakai model fluida ideal dengan empat anggapan.",
        "hl": [
          "fluida ideal"
        ],
        "pause": 0.7
      },
      {
        "text": "Tak termampatkan: massa jenisnya tetap. Tak kental: tidak ada gesekan di dalamnya.",
        "hl": [
          "Tak termampatkan",
          "Tak kental"
        ],
        "pause": 0.7
      },
      {
        "text": "Alirannya tunak: kecepatan di setiap titik tidak berubah terhadap waktu. Dan alirannya tidak berpusar.",
        "hl": [
          "tunak",
          "tidak berpusar"
        ],
        "pause": 0.7
      },
      {
        "text": "Lintasan partikel-partikel fluida digambarkan sebagai garis arus.",
        "hl": [
          "garis arus"
        ],
        "pause": 0.7
      },
      {
        "text": "Garis arus tidak pernah berpotongan. Di tempat garis-garisnya merapat, aliran lebih cepat.",
        "hl": [
          "merapat",
          "lebih cepat"
        ],
        "pause": 0.7
      },
      {
        "text": "Udara pun boleh dianggap tak termampatkan, selama kecepatannya jauh di bawah kecepatan suara.",
        "hl": [
          "jauh di bawah kecepatan suara"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "flow",
    "chapter": "02",
    "title": "Laminar atau turbulen",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Perhatikan asap dupa yang naik di udara yang tenang.",
        "pause": 0.6
      },
      {
        "text": "Mula-mula asap naik dalam garis-garis halus yang rapi. Ini aliran laminar.",
        "hl": [
          "laminar"
        ],
        "pause": 0.7
      },
      {
        "text": "Lalu tiba-tiba asap pecah menjadi pusaran yang kacau. Ini aliran turbulen.",
        "hl": [
          "turbulen"
        ],
        "pause": 0.8
      },
      {
        "text": "Penentunya adalah bilangan Reynolds: massa jenis kali kecepatan kali diameter, dibagi kekentalan.",
        "hl": [
          "bilangan Reynolds"
        ],
        "pause": 0.7
      },
      {
        "text": "Di dalam pipa, aliran cenderung laminar bila bilangan Reynolds di bawah sekitar dua ribu, dan turbulen bila jauh di atasnya.",
        "hl": [
          "dua ribu"
        ],
        "pause": 0.7
      },
      {
        "text": "Air keran dalam pipa dua sentimeter yang mengalir satu meter per detik sudah bernilai sekitar dua puluh ribu: turbulen.",
        "hl": [
          "dua puluh ribu"
        ],
        "pause": 0.7
      },
      {
        "text": "Rumus-rumus di video ini dibangun dari model ideal yang tenang dan rapi, dan tetap menjadi pendekatan pertama yang sangat berguna.",
        "hl": [
          "pendekatan pertama"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "debit",
    "chapter": "03",
    "title": "Debit: seberapa deras",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Berapa banyak air yang keluar dari keran setiap detik? Besaran ini disebut debit.",
        "hl": [
          "debit"
        ],
        "pause": 0.7
      },
      {
        "text": "Debit adalah volume dibagi waktu, satuannya meter kubik per detik.",
        "hl": [
          "volume dibagi waktu"
        ],
        "pause": 0.7
      },
      {
        "text": "Sebuah ember dua puluh liter penuh dalam empat puluh detik. Debitnya setengah liter per detik,",
        "hl": [
          "setengah liter per detik"
        ],
        "pause": 0.3
      },
      {
        "text": "atau lima kali sepuluh pangkat minus empat meter kubik per detik.",
        "pause": 0.7
      },
      {
        "text": "Bayangkan air dalam pipa sebagai silinder yang terus didorong maju. Dalam satu detik, silinder sepanjang v melewati penampang A.",
        "hl": [
          "sepanjang v"
        ],
        "pause": 0.7
      },
      {
        "text": "Jadi debit sama dengan luas penampang kali kecepatan: Q sama dengan A v.",
        "hl": [
          "Q sama dengan A v"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "continuity",
    "chapter": "04",
    "title": "Kontinuitas: jempol di ujung selang",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kembali ke selang. Air tidak bisa dimampatkan dan tidak hilang di tengah jalan.",
        "hl": [
          "tidak hilang"
        ],
        "pause": 0.7
      },
      {
        "text": "Jadi setiap detik, volume yang masuk ke satu bagian pipa harus sama dengan volume yang keluar.",
        "hl": [
          "masuk",
          "keluar"
        ],
        "pause": 0.7
      },
      {
        "text": "Debit di mana pun sama: A satu kali v satu sama dengan A dua kali v dua. Inilah persamaan kontinuitas.",
        "hl": [
          "persamaan kontinuitas"
        ],
        "pause": 0.8
      },
      {
        "text": "Ujung selang seluas dua sentimeter persegi menyemburkan setengah liter per detik dengan kecepatan dua koma lima meter per detik.",
        "hl": [
          "dua koma lima meter per detik"
        ],
        "pause": 0.7
      },
      {
        "text": "Tutup dengan jempol hingga lubangnya tinggal setengah sentimeter persegi. Luasnya empat kali lebih kecil,",
        "hl": [
          "empat kali lebih kecil"
        ],
        "pause": 0.3
      },
      {
        "text": "maka kecepatannya empat kali lebih besar: sepuluh meter per detik.",
        "hl": [
          "sepuluh meter per detik"
        ],
        "pause": 0.8
      },
      {
        "text": "Seperti kerumunan yang melewati pintu sempit: agar jumlah orang per detik tetap, setiap orang harus bergerak lebih cepat.",
        "hl": [
          "pintu sempit"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "pressurespeed",
    "chapter": "05",
    "title": "Mengapa yang cepat bertekanan rendah",
    "mood": "tension",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Air memang lebih cepat di bagian sempit. Tapi apa yang mempercepatnya?",
        "hl": [
          "apa yang mempercepatnya"
        ],
        "pause": 0.8
      },
      {
        "text": "Sebuah benda hanya bisa dipercepat oleh gaya total. Untuk sepotong fluida, gaya itu datang dari beda tekanan.",
        "hl": [
          "beda tekanan"
        ],
        "pause": 0.7
      },
      {
        "text": "Saat memasuki bagian sempit, potongan air dipercepat. Artinya tekanan di belakangnya lebih besar daripada tekanan di depannya.",
        "hl": [
          "di belakangnya lebih besar"
        ],
        "pause": 0.7
      },
      {
        "text": "Jadi di bagian sempit yang cepat, tekanannya lebih rendah.",
        "hl": [
          "tekanannya lebih rendah"
        ],
        "pause": 0.9
      },
      {
        "text": "Itulah sebabnya dua lembar kertas merapat: udara cepat di antaranya bertekanan lebih rendah daripada udara diam di luar.",
        "hl": [
          "merapat"
        ],
        "pause": 0.7
      },
      {
        "text": "Bukan aliran yang menarik kertas. Udara luar yang bertekanan lebih tinggi mendorongnya ke dalam.",
        "hl": [
          "mendorongnya"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "bernoulli",
    "chapter": "06",
    "title": "Persamaan Bernoulli",
    "mood": "bright",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Daniel Bernoulli merangkum gagasan ini dalam satu persamaan, pada tahun seribu tujuh ratus tiga puluh delapan.",
        "hl": [
          "Daniel Bernoulli"
        ],
        "pause": 0.7
      },
      {
        "text": "Kuncinya adalah energi, yang sudah kita pelajari di video pertama seri ini.",
        "hl": [
          "energi"
        ],
        "pause": 0.7
      },
      {
        "text": "Setiap meter kubik fluida membawa tiga bentuk energi: energi tekanan p,",
        "hl": [
          "energi tekanan"
        ],
        "pause": 0.3
      },
      {
        "text": "energi kinetik setengah rho v kuadrat, dan energi potensial rho g h.",
        "hl": [
          "energi kinetik",
          "energi potensial"
        ],
        "pause": 0.7
      },
      {
        "text": "Di sepanjang satu garis arus fluida ideal, jumlah ketiganya tetap.",
        "hl": [
          "jumlah ketiganya tetap"
        ],
        "pause": 0.8
      },
      {
        "text": "Jadi bila fluida dipercepat, energi kinetiknya naik, dan yang membayarnya adalah tekanan.",
        "hl": [
          "yang membayarnya adalah tekanan"
        ],
        "pause": 0.7
      },
      {
        "text": "Persamaan Bernoulli adalah hukum kekekalan energi, ditulis untuk fluida yang mengalir.",
        "hl": [
          "kekekalan energi"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "venturi",
    "chapter": "07",
    "title": "Venturimeter: kecepatan dari tekanan",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Pipa yang menyempit lalu melebar lagi disebut pipa Venturi.",
        "hl": [
          "pipa Venturi"
        ],
        "pause": 0.7
      },
      {
        "text": "Air masuk pada pipa berdiameter empat sentimeter dengan kecepatan satu meter per detik.",
        "hl": [
          "satu meter per detik"
        ],
        "pause": 0.7
      },
      {
        "text": "Di leher berdiameter dua sentimeter, luasnya empat kali lebih kecil, jadi kecepatannya empat meter per detik.",
        "hl": [
          "empat meter per detik"
        ],
        "pause": 0.7
      },
      {
        "text": "Pipanya mendatar, jadi rho g h sama di kedua titik. Beda tekanannya setengah rho kali v dua kuadrat dikurangi v satu kuadrat:",
        "pause": 0.3
      },
      {
        "text": "setengah kali seribu kali enam belas dikurangi satu, yaitu tujuh ribu lima ratus pascal.",
        "hl": [
          "tujuh ribu lima ratus pascal"
        ],
        "pause": 0.8
      },
      {
        "text": "Tabung kecil di atasnya menunjukkan beda tinggi kolom air tujuh puluh lima sentimeter.",
        "hl": [
          "tujuh puluh lima sentimeter"
        ],
        "pause": 0.7
      },
      {
        "text": "Dari beda tinggi itu, kecepatan aliran bisa dihitung balik. Inilah venturimeter.",
        "hl": [
          "venturimeter"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "torricelli",
    "chapter": "08",
    "title": "Torricelli: lubang di dinding tangki",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sebuah tangki terbuka berlubang kecil di dindingnya, satu koma dua lima meter di bawah permukaan air.",
        "hl": [
          "satu koma dua lima meter"
        ],
        "pause": 0.7
      },
      {
        "text": "Permukaan dan lubang sama-sama terbuka ke udara, jadi tekanannya sama. Permukaan airnya turun sangat lambat.",
        "hl": [
          "tekanannya sama"
        ],
        "pause": 0.7
      },
      {
        "text": "Persamaan Bernoulli tinggal menyisakan rho g h sama dengan setengah rho v kuadrat: v sama dengan akar dua g h.",
        "hl": [
          "akar dua g h"
        ],
        "pause": 0.7
      },
      {
        "text": "Akar dari dua kali sepuluh kali satu koma dua lima adalah lima meter per detik.",
        "hl": [
          "lima meter per detik"
        ],
        "pause": 0.7
      },
      {
        "text": "Sama persis dengan kecepatan batu yang jatuh bebas dari ketinggian yang sama. Inilah teorema Torricelli.",
        "hl": [
          "teorema Torricelli"
        ],
        "pause": 0.8
      },
      {
        "text": "Bila lubang berada delapan puluh sentimeter di atas lantai, air melayang selama nol koma empat detik,",
        "hl": [
          "nol koma empat detik"
        ],
        "pause": 0.3
      },
      {
        "text": "dan mendarat dua meter dari dinding tangki.",
        "hl": [
          "dua meter"
        ],
        "pause": 0.8
      },
      {
        "text": "Makin dalam lubangnya, makin kencang semburannya, karena tekanan hidrostatis di sana makin besar.",
        "hl": [
          "makin kencang"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "lift",
    "chapter": "09",
    "title": "Gaya angkat sayap",
    "mood": "tension",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sekarang pesawat tadi. Sayap dibentuk dan dimiringkan sehingga membelokkan aliran udara ke bawah.",
        "hl": [
          "membelokkan aliran udara ke bawah"
        ],
        "pause": 0.7
      },
      {
        "text": "Udara di atas sayap mengalir lebih cepat dan bertekanan lebih rendah daripada udara di bawahnya.",
        "hl": [
          "lebih cepat",
          "lebih rendah"
        ],
        "pause": 0.7
      },
      {
        "text": "Hati-hati dengan penjelasan populer yang keliru: udara atas dan bawah tidak harus tiba bersamaan di ujung sayap.",
        "hl": [
          "keliru"
        ],
        "pause": 0.7
      },
      {
        "text": "Kenyataannya, udara di atas sayap justru tiba lebih dulu.",
        "hl": [
          "tiba lebih dulu"
        ],
        "pause": 0.8
      },
      {
        "text": "Pesawat penumpang sekitar tujuh puluh ton dengan luas sayap sekitar seratus dua puluh meter persegi",
        "pause": 0.3
      },
      {
        "text": "hanya membutuhkan beda tekanan sekitar lima ribu delapan ratus pascal, kurang dari enam persen tekanan atmosfer.",
        "hl": [
          "kurang dari enam persen"
        ],
        "pause": 0.8
      },
      {
        "text": "Beda tekanan yang kecil, dikalikan luas yang besar, cukup untuk mengangkat tujuh puluh ton.",
        "hl": [
          "luas yang besar"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "viscosity",
    "chapter": "10",
    "title": "Kekentalan & hukum Poiseuille",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Fluida nyata punya gesekan dalam yang disebut kekentalan atau viskositas, diberi simbol eta.",
        "hl": [
          "viskositas"
        ],
        "pause": 0.7
      },
      {
        "text": "Madu ribuan kali lebih kental daripada air, sehingga mengalir sangat lambat.",
        "hl": [
          "ribuan kali"
        ],
        "pause": 0.7
      },
      {
        "text": "Di dalam pipa, fluida kental paling cepat di tengah dan diam di dinding. Profil kecepatannya berbentuk parabola.",
        "hl": [
          "parabola"
        ],
        "pause": 0.7
      },
      {
        "text": "Untuk aliran laminar, hukum Poiseuille menyatakan debit sebanding dengan jari-jari pipa pangkat empat.",
        "hl": [
          "jari-jari pipa pangkat empat"
        ],
        "pause": 0.7
      },
      {
        "text": "Perkecil jari-jari pipa menjadi setengahnya, dan debitnya turun enam belas kali.",
        "hl": [
          "enam belas kali"
        ],
        "pause": 0.8
      },
      {
        "text": "Pada fluida kental, beda tekanan dibutuhkan hanya untuk menjaga aliran tetap berjalan.",
        "hl": [
          "menjaga aliran tetap berjalan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "strategy",
    "chapter": "11",
    "title": "Cara berpikir: soal fluida dinamis",
    "mood": "resolve",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Bagaimana menaklukkan soal fluida dinamis? Gunakan urutan berpikir ini.",
        "hl": [
          "urutan berpikir"
        ],
        "pause": 0.7
      },
      {
        "text": "Pertama, pilih dua titik pada garis arus yang sama, dan tentukan bidang acuan ketinggian.",
        "hl": [
          "dua titik"
        ],
        "pause": 0.7
      },
      {
        "text": "Kedua, cari kecepatan dengan kontinuitas. Ketiga, cari tekanan dengan Bernoulli.",
        "hl": [
          "kontinuitas",
          "Bernoulli"
        ],
        "pause": 0.7
      },
      {
        "text": "Keempat, periksa satuan: sentimeter persegi ke meter persegi, liter per detik ke meter kubik per detik.",
        "hl": [
          "periksa satuan"
        ],
        "pause": 0.8
      },
      {
        "text": "Contoh: air mengalir di pipa lantai dasar dengan kecepatan dua meter per detik dan tekanan seratus lima puluh kilopascal.",
        "pause": 0.7
      },
      {
        "text": "Pipa naik lima meter ke lantai dua dan luasnya menjadi setengah, jadi kecepatannya empat meter per detik.",
        "hl": [
          "empat meter per detik"
        ],
        "pause": 0.7
      },
      {
        "text": "Tekanan di atas sama dengan seratus lima puluh ribu, dikurangi enam ribu untuk menambah kecepatan, dikurangi lima puluh ribu untuk menaikkan air.",
        "pause": 0.7
      },
      {
        "text": "Hasilnya sembilan puluh empat kilopascal. Tekanan turun karena air harus dipercepat dan diangkat.",
        "hl": [
          "sembilan puluh empat kilopascal"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "aspirator",
    "chapter": "12",
    "title": "Pompa vakum air",
    "mood": "wonder",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Di laboratorium kimia, penyaringan dengan corong Büchner butuh hisapan agar cepat.",
        "hl": [
          "corong Büchner"
        ],
        "pause": 0.7
      },
      {
        "text": "Alatnya sering sangat sederhana: pompa vakum air yang dipasang di keran.",
        "hl": [
          "pompa vakum air"
        ],
        "pause": 0.7
      },
      {
        "text": "Air dari keran dipaksa melewati nosel sempit dan menyembur sangat cepat.",
        "hl": [
          "nosel sempit"
        ],
        "pause": 0.7
      },
      {
        "text": "Pancaran yang cepat itu bertekanan rendah, sehingga udara dari labu penyaring tersedot masuk dan ikut terbawa air.",
        "hl": [
          "tersedot masuk"
        ],
        "pause": 0.7
      },
      {
        "text": "Tekanan di labu turun, dan udara luar mendorong cairan menembus kertas saring.",
        "hl": [
          "udara luar mendorong"
        ],
        "pause": 0.7
      },
      {
        "text": "Batas terendahnya kira-kira tekanan uap air, sekitar dua koma tiga kilopascal pada dua puluh derajat Celsius.",
        "hl": [
          "tekanan uap air"
        ],
        "pause": 0.7
      },
      {
        "text": "Karena itu air yang lebih dingin memberi vakum yang lebih baik.",
        "hl": [
          "lebih dingin"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "bunsen",
    "chapter": "13",
    "title": "Pembakar Bunsen",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Pembakar Bunsen memakai prinsip yang sama.",
        "hl": [
          "prinsip yang sama"
        ],
        "pause": 0.5
      },
      {
        "text": "Gas keluar dari lubang kecil di dasar cerobong dengan kecepatan tinggi, sehingga tekanannya turun.",
        "hl": [
          "tekanannya turun"
        ],
        "pause": 0.7
      },
      {
        "text": "Udara luar terdorong masuk melalui lubang di cincin pengatur, lalu bercampur dengan gas sebelum terbakar.",
        "hl": [
          "bercampur"
        ],
        "pause": 0.7
      },
      {
        "text": "Cincin dibuka, oksigen cukup: nyala biru yang panas dan bersih.",
        "hl": [
          "nyala biru"
        ],
        "pause": 0.7
      },
      {
        "text": "Cincin ditutup, oksigen kurang: nyala kuning berjelaga yang lebih dingin.",
        "hl": [
          "nyala kuning"
        ],
        "pause": 0.7
      },
      {
        "text": "Tanpa kipas dan tanpa listrik, aliran gas itu sendiri yang menghisap udara.",
        "hl": [
          "aliran gas itu sendiri"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "nebulizer",
    "chapter": "14",
    "title": "Nebulizer spektrometer",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Pada spektrometer serapan atom, larutan sampel harus diubah menjadi kabut halus sebelum masuk ke nyala.",
        "hl": [
          "kabut halus"
        ],
        "pause": 0.7
      },
      {
        "text": "Tugas ini dikerjakan oleh nebulizer.",
        "hl": [
          "nebulizer"
        ],
        "pause": 0.5
      },
      {
        "text": "Aliran gas yang sangat cepat melewati ujung pipa kapiler yang tercelup dalam larutan sampel.",
        "hl": [
          "sangat cepat"
        ],
        "pause": 0.7
      },
      {
        "text": "Tekanan di ujung kapiler turun, sehingga larutan terhisap naik tanpa pompa.",
        "hl": [
          "tanpa pompa"
        ],
        "pause": 0.7
      },
      {
        "text": "Di ujung kapiler, pancaran gas memecah cairan menjadi butiran-butiran sangat kecil.",
        "hl": [
          "butiran-butiran sangat kecil"
        ],
        "pause": 0.7
      },
      {
        "text": "Prinsip yang sama bekerja pada botol semprot parfum dan alat nebulizer untuk pengobatan asma.",
        "hl": [
          "botol semprot parfum"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "viscometer",
    "chapter": "15",
    "title": "Viskometer Ostwald",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kekentalan cairan bisa diukur dengan alat kaca sederhana: viskometer Ostwald.",
        "hl": [
          "viskometer Ostwald"
        ],
        "pause": 0.7
      },
      {
        "text": "Cairan dibiarkan mengalir turun melalui pipa kapiler, dan waktu alirnya dicatat dengan stopwatch.",
        "hl": [
          "waktu alirnya"
        ],
        "pause": 0.7
      },
      {
        "text": "Makin kental cairan, makin lama waktu alirnya. Makin besar massa jenisnya, makin kuat gravitasi mendorongnya.",
        "hl": [
          "makin lama"
        ],
        "pause": 0.7
      },
      {
        "text": "Jadi kekentalan sebanding dengan massa jenis kali waktu alir, dan bisa dibandingkan dengan air.",
        "hl": [
          "massa jenis kali waktu alir"
        ],
        "pause": 0.7
      },
      {
        "text": "Air mengalir dalam enam puluh detik. Cairan X bermassa jenis delapan ratus mengalir dalam sembilan puluh detik.",
        "pause": 0.7
      },
      {
        "text": "Kekentalannya satu koma dua kali kekentalan air, sekitar satu koma dua milipascal sekon, mendekati etanol.",
        "hl": [
          "satu koma dua"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "blood",
    "chapter": "16",
    "title": "Pembuluh darah yang menyempit",
    "mood": "tension",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Darah mengalir di pembuluh yang bisa menyempit karena timbunan plak.",
        "hl": [
          "plak"
        ],
        "pause": 0.7
      },
      {
        "text": "Di bagian yang menyempit, darah mengalir lebih cepat, dan menurut Bernoulli tekanannya turun.",
        "hl": [
          "tekanannya turun"
        ],
        "pause": 0.7
      },
      {
        "text": "Tekanan dari luar dapat menekan dinding yang lemah itu hingga sesaat tertutup, lalu terbuka lagi: pembuluh bergetar.",
        "hl": [
          "pembuluh bergetar"
        ],
        "pause": 0.7
      },
      {
        "text": "Yang lebih berat adalah akibat hukum Poiseuille. Jari-jari menyempit dua puluh persen saja,",
        "hl": [
          "dua puluh persen"
        ],
        "pause": 0.3
      },
      {
        "text": "debit darah tinggal sekitar empat puluh persen, bila beda tekanannya tetap.",
        "hl": [
          "empat puluh persen"
        ],
        "pause": 0.8
      },
      {
        "text": "Karena itu jantung harus memompa lebih keras, dan tekanan darah naik.",
        "hl": [
          "memompa lebih keras"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "ships",
    "chapter": "17",
    "title": "Kapal yang berpapasan",
    "mood": "tension",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Dua kapal yang berlayar berdampingan terlalu dekat bisa saling tertarik.",
        "hl": [
          "saling tertarik"
        ],
        "pause": 0.7
      },
      {
        "text": "Air di celah sempit di antara keduanya mengalir lebih cepat relatif terhadap kapal, sehingga tekanannya lebih rendah.",
        "hl": [
          "tekanannya lebih rendah"
        ],
        "pause": 0.7
      },
      {
        "text": "Air di sisi luar yang bertekanan lebih tinggi mendorong kedua kapal saling mendekat.",
        "hl": [
          "mendorong"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada tahun seribu sembilan ratus sebelas, kapal perang Hawke tertarik dan menabrak lambung kapal Olympic, kapal kembar Titanic.",
        "hl": [
          "Olympic"
        ],
        "pause": 0.8
      },
      {
        "text": "Hal yang sama membuat kita harus berdiri di belakang garis kuning saat kereta cepat melintas.",
        "hl": [
          "garis kuning"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "roof",
    "chapter": "18",
    "title": "Atap yang terangkat badai",
    "mood": "tension",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Saat badai, angin kencang bertiup di atas atap rumah, sementara udara di dalam rumah hampir diam.",
        "hl": [
          "hampir diam"
        ],
        "pause": 0.7
      },
      {
        "text": "Udara cepat di atas atap bertekanan lebih rendah daripada udara di dalam.",
        "hl": [
          "lebih rendah"
        ],
        "pause": 0.7
      },
      {
        "text": "Angin tiga puluh meter per detik, sekitar seratus delapan kilometer per jam, menghasilkan beda tekanan setengah rho v kuadrat:",
        "pause": 0.3
      },
      {
        "text": "setengah kali satu koma dua kali sembilan ratus, sekitar lima ratus empat puluh pascal.",
        "hl": [
          "lima ratus empat puluh pascal"
        ],
        "pause": 0.8
      },
      {
        "text": "Kecil? Kalikan dengan atap seluas seratus meter persegi: lima puluh empat ribu newton ke atas, setara berat lebih dari lima ton.",
        "hl": [
          "lebih dari lima ton"
        ],
        "pause": 0.8
      },
      {
        "text": "Itulah sebabnya atap harus diikat kuat ke dinding, bukan hanya diletakkan di atasnya.",
        "hl": [
          "diikat kuat"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "recap",
    "chapter": "19",
    "title": "Rangkuman",
    "mood": "resolve",
    "lead": 1.0,
    "tail": 1.6,
    "lines": [
      {
        "text": "Mari rangkum.",
        "pause": 0.5
      },
      {
        "text": "Debit adalah luas kali kecepatan. Untuk fluida tak termampatkan debit di mana pun sama, jadi di bagian sempit aliran lebih cepat.",
        "hl": [
          "di bagian sempit aliran lebih cepat"
        ],
        "pause": 0.7
      },
      {
        "text": "Bernoulli adalah kekekalan energi: tekanan, ditambah setengah rho v kuadrat, ditambah rho g h, tetap di sepanjang garis arus.",
        "hl": [
          "kekekalan energi"
        ],
        "pause": 0.7
      },
      {
        "text": "Di tempat aliran lebih cepat, tekanannya lebih rendah. Dari sinilah semburan Torricelli, venturimeter, dan gaya angkat sayap.",
        "hl": [
          "tekanannya lebih rendah"
        ],
        "pause": 0.7
      },
      {
        "text": "Fluida nyata punya kekentalan, dan debitnya sangat peka terhadap jari-jari pipa: pangkat empat.",
        "hl": [
          "pangkat empat"
        ],
        "pause": 0.7
      },
      {
        "text": "Jadi, setiap kali melihat sesuatu mengalir, tanyakan: di mana alirannya cepat, dan ke mana tekanan mendorongnya?",
        "hl": [
          "ke mana tekanan mendorongnya"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "outro",
    "chapter": "",
    "title": "Penutup",
    "mood": "outro",
    "fixed": 16,
    "lines": []
  }
];
