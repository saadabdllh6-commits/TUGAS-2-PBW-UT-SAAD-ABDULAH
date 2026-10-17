(function () {
  const source = window.DATA_BAHAN_AJAR;
  const initialTracking = source.tracking || {};
  const yearNow = new Date().getFullYear();
  const initialDO = Object.keys(initialTracking).map(nomor => {
    const item = initialTracking[nomor];
    return {
      nomor, nim: item.nim, nama: item.nama, status: item.status, ekspedisi: item.ekspedisi,
      tanggalKirim: item.tanggalKirim, paket: item.paket, total: item.total,
      perjalanan: (item.perjalanan || []).slice()
    };
  });
  new Vue({
    el: "#tracking-app",
    data: {
      paket: source.paket.slice(), pengirimanList: source.pengirimanList.slice(),
      stok: source.stok.slice(), daftarDO: initialDO, showForm: false, searchText: "", filterStatus: "",
      selectedDO: null, toastMessage: "", formError: "",
      form: { nim: "", nama: "", ekspedisi: "", paketKode: "", tanggalKirim: new Date().toLocaleDateString("en-CA") }
    },
    computed: {
      paketTerpilih() { return this.paket.find(p => p.kode === this.form.paketKode) || null; },
      nomorBerikutnya() {
        const year = new Date().getFullYear();
        const nums = this.daftarDO.map(d => {
          const match = d.nomor.match(/^DO\d{4}-(\d+)$/);
          return match && d.nomor.startsWith("DO" + year + "-") ? Number(match[1]) : 0;
        });
        const next = Math.max(0, ...nums) + 1;
        return "DO" + year + "-" + String(next).padStart(3, "0");
      },
      filteredDO() {
        const q = this.searchText.toLowerCase();
        return this.daftarDO.filter(d => (!this.filterStatus || d.status === this.filterStatus) &&
          (!q || (d.nomor + " " + d.nim + " " + d.nama).toLowerCase().includes(q)))
          .slice().sort((a, b) => b.nomor.localeCompare(a.nomor));
      },
      jumlahDalamPerjalanan() { return this.daftarDO.filter(d => d.status === "Dalam Perjalanan").length; },
      totalNilai() { return this.daftarDO.reduce((sum, d) => sum + Number(d.total || 0), 0); }
    },
    watch: {
      "form.paketKode"(newCode) { if (newCode && !this.paket.some(p => p.kode === newCode)) this.form.paketKode = ""; },
      searchText() { /* watcher 2: daftar tracking diperbarui ketika kata kunci berubah */ },
      showForm(value) { if (value) this.formError = ""; }
    },
    methods: {
      formatRupiah(value) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0); },
      formatTanggal(value) { if (!value) return "—"; return new Date(value + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }); },
      judulMataKuliah(kode) { const item = this.stok.find(s => s.kode === kode); return item ? item.judul : "Nama tidak tersedia"; },
      pilihDO(item) { this.selectedDO = item; window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); },
      resetForm() { this.form = { nim: "", nama: "", ekspedisi: "", paketKode: "", tanggalKirim: new Date().toLocaleDateString("en-CA") }; this.formError = ""; },
      buatDO() {
        if (!this.form.nim || !/^[0-9]{8,15}$/.test(this.form.nim)) { this.formError = "NIM harus terdiri dari 8 sampai 15 angka."; return; }
        if (!this.form.nama.trim() || !this.form.ekspedisi || !this.paketTerpilih || !this.form.tanggalKirim) { this.formError = "Lengkapi semua kolom sebelum menyimpan."; return; }
        const paket = this.paketTerpilih;
        const item = {
          nomor: this.nomorBerikutnya, nim: this.form.nim, nama: this.form.nama.trim(),
          status: "Diproses", ekspedisi: this.form.ekspedisi, tanggalKirim: this.form.tanggalKirim,
          paket: paket.kode, total: paket.harga,
          perjalanan: [{ waktu: this.form.tanggalKirim + " 09:00:00", keterangan: "Delivery order dibuat dan menunggu proses pengiriman" }]
        };
        this.daftarDO.unshift(item);
        this.selectedDO = item;
        this.showForm = false;
        this.resetForm();
        this.toastMessage = "Delivery order " + item.nomor + " berhasil dibuat.";
        setTimeout(() => { this.toastMessage = ""; }, 3000);
      }
    }
  });
})();