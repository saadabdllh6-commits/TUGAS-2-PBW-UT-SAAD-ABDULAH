(function () {
  const source = window.DATA_BAHAN_AJAR;
  new Vue({
    el: "#app",
    data: {
      upbjjList: source.upbjjList.slice(),
      kategoriList: source.kategoriList.slice(),
      stok: source.stok.map(item => Object.assign({}, item)),
      filterUpbjj: "", filterKategori: "", filterKondisi: "", sortBy: "judul", sortOrder: "asc",
      searchText: "", showForm: false, editingKode: "", formError: "", toastMessage: "",
      form: {}
    },
    computed: {
      kategoriTersedia() {
        if (!this.filterUpbjj) return this.kategoriList;
        return this.kategoriList.filter(k => this.stok.some(s => s.upbjj === this.filterUpbjj && s.kategori === k));
      },
      filteredStok() {
        let rows = this.stok.filter(item => {
          const matchesUpbjj = !this.filterUpbjj || item.upbjj === this.filterUpbjj;
          const matchesKategori = !this.filterKategori || item.kategori === this.filterKategori;
          const matchesSearch = !this.searchText || (item.kode + " " + item.judul).toLowerCase().includes(this.searchText.toLowerCase());
          let matchesCondition = true;
          if (this.filterKondisi === "kosong") matchesCondition = item.qty === 0;
          if (this.filterKondisi === "menipis") matchesCondition = item.qty > 0 && item.qty < item.safety;
          if (this.filterKondisi === "aman") matchesCondition = item.qty >= item.safety;
          return matchesUpbjj && matchesKategori && matchesSearch && matchesCondition;
        });
        return rows.slice().sort((a, b) => {
          let result = this.sortBy === "judul" ? a.judul.localeCompare(b.judul, "id") : a[this.sortBy] - b[this.sortBy];
          return this.sortOrder === "desc" ? -result : result;
        });
      },
      totalStok() { return this.stok.reduce((sum, item) => sum + Number(item.qty || 0), 0); },
      jumlahMenipis() { return this.stok.filter(item => item.qty > 0 && item.qty < item.safety).length; },
      jumlahKosong() { return this.stok.filter(item => item.qty === 0).length; }
    },
    watch: {
      filterUpbjj() {
        if (this.filterKategori && !this.kategoriTersedia.includes(this.filterKategori)) this.filterKategori = "";
      },
      filterKondisi() { /* watcher 2: pantau perubahan kondisi stok untuk reaktivitas filter */ },
      sortBy() { if (this.sortBy === "judul") this.sortOrder = "asc"; }
    },
    created() { this.resetFormData(); },
    methods: {
      resetFormData() { this.form = { kode: "", judul: "", kategori: "", upbjj: "", lokasiRak: "", harga: 0, qty: 0, safety: 0, catatanHTML: "" }; },
      formatRupiah(value) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0); },
      statusStok(item) { if (item.qty === 0) return "Kosong"; if (item.qty < item.safety) return "Menipis"; return "Aman"; },
      statusClass(item) { if (item.qty === 0) return "status-empty"; if (item.qty < item.safety) return "status-warn"; return "status-safe"; },
      statusIcon(item) { if (item.qty === 0) return "●"; if (item.qty < item.safety) return "▲"; return "✓"; },
      stockPercent(item) { return Math.min(100, item.safety ? item.qty / item.safety * 100 : 100); },
      resetFilter() { this.filterUpbjj = ""; this.filterKategori = ""; this.filterKondisi = ""; this.sortBy = "judul"; this.sortOrder = "asc"; this.searchText = ""; },
      openAddForm() { this.editingKode = ""; this.formError = ""; this.resetFormData(); this.showForm = true; },
      editItem(item) { this.editingKode = item.kode; this.formError = ""; this.form = Object.assign({}, item, { catatanHTML: item.catatanHTML.replace(/<[^>]*>/g, "") }); this.showForm = true; window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); },
      closeForm() { this.showForm = false; this.formError = ""; },
      saveItem() {
        const f = this.form;
        if (!f.kode || !f.judul || !f.kategori || !f.upbjj || !f.lokasiRak) { this.formError = "Semua kolom wajib diisi."; return; }
        if ([f.harga, f.qty, f.safety].some(v => !Number.isFinite(Number(v)) || Number(v) < 0)) { this.formError = "Harga, stok, dan safety stock harus berupa angka nol atau lebih."; return; }
        if (!this.editingKode && this.stok.some(item => item.kode.toLowerCase() === f.kode.toLowerCase())) { this.formError = "Kode mata kuliah sudah digunakan. Gunakan kode yang berbeda."; return; }
        const clean = Object.assign({}, f, { kode: f.kode.toUpperCase(), harga: Number(f.harga), qty: Number(f.qty), safety: Number(f.safety), catatanHTML: this.escapeHtml(f.catatanHTML) });
        if (this.editingKode) {
          const index = this.stok.findIndex(item => item.kode === this.editingKode);
          if (index >= 0) this.$set(this.stok, index, clean);
          this.toastMessage = "Perubahan stok berhasil disimpan.";
        } else {
          this.stok.push(clean);
          if (!this.upbjjList.includes(clean.upbjj)) this.upbjjList.push(clean.upbjj);
          if (!this.kategoriList.includes(clean.kategori)) this.kategoriList.push(clean.kategori);
          this.toastMessage = "Bahan ajar baru berhasil ditambahkan.";
        }
        this.closeForm();
        setTimeout(() => { this.toastMessage = ""; }, 2800);
      },
      escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
    }
  });
})();