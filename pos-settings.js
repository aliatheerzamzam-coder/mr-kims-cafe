/* ============================================================================
   Mr. Kim's POS — Settings module (Sprint 1)
   --------------------------------------------------------------------------
   Owner-only admin surface mounted inside cashier.html under #v-settings.
   Exposes window.MKS for the bootstrap script. Each section is a render
   function that paints into #set-pane on demand. Network calls reuse the
   cashier token (server promotes owner-role cashiers to admin endpoints —
   see requireAuth in server.js).

   Modules included here:
     - manager-override modal (reusable across the app, not only settings)
     - force-change-password modal (shown when login returns must_change_pw)
     - section: store info
     - section: staff (list + create + edit + reset-pw)
     - section: roles & permissions matrix
     - section: security (admin pw, login config, audit log viewer)
   ============================================================================ */

window.MKS = (function () {

  // i18n labels for this module — loaded lazily and merged into MK.T at init.
  // Using English/Arabic only per project rule (Iraq market).
  const SETTINGS_I18N = {
    ar: {
      settings: 'الإعدادات',
      sec_store: 'معلومات المتجر',
      sec_staff: 'الموظفون',
      sec_roles: 'الأدوار والصلاحيات',
      sec_menu:  'القائمة',
      sec_security: 'الأمان والسجلات',
      store_name_en: 'اسم المتجر (إنجليزي)',
      store_name_ar: 'اسم المتجر (عربي)',
      store_address_en: 'العنوان (إنجليزي)',
      store_address_ar: 'العنوان (عربي)',
      store_phone: 'الهاتف',
      store_tax_id: 'الرقم الضريبي',
      store_logo: 'شعار المتجر (URL)',
      store_hours: 'ساعات العمل',
      receipt_footer_en: 'تذييل الإيصال (إنجليزي)',
      receipt_footer_ar: 'تذييل الإيصال (عربي)',
      save: 'حفظ',
      cancel: 'إلغاء',
      saved_ok: '✓ تم الحفظ',
      err_generic: 'حدث خطأ. حاول مرة أخرى.',
      // staff
      staff_add: '+ إضافة موظف',
      staff_name: 'الاسم',
      staff_email: 'البريد الإلكتروني',
      staff_phone: 'الهاتف',
      staff_role: 'الدور',
      staff_active: 'نشط',
      staff_password: 'كلمة المرور',
      staff_create: 'إنشاء',
      staff_reset_pw: 'إعادة تعيين كلمة المرور',
      staff_delete: 'حذف',
      staff_edit: 'تعديل',
      staff_last_login: 'آخر تسجيل دخول',
      staff_never: 'لم يدخل',
      staff_pw_generated: 'كلمة المرور المؤقتة',
      staff_pw_copy: 'نسخ',
      staff_pw_close: 'إغلاق',
      staff_must_change_pw: 'سيُطلب من الموظف تغيير كلمة المرور عند تسجيل الدخول',
      confirm_delete_staff: 'حذف هذا الموظف؟ لا يمكن التراجع.',
      confirm_reset_pw: 'إعادة تعيين كلمة المرور؟ سيتم تسجيل خروج الموظف.',
      // roles
      role_owner: 'المالك', role_manager: 'مدير', role_cashier: 'كاشير', role_barista: 'باريستا',
      perm_locked: 'مقفل (مالك فقط)',
      // groups
      grp_cash: 'النقدية والصندوق',
      grp_orders: 'الطلبات والإسترداد',
      grp_discounts: 'الخصومات',
      grp_shifts: 'الورديات',
      grp_customers: 'العملاء والطوابع',
      grp_menu: 'القائمة والمخزون',
      grp_reports: 'التقارير والبيانات',
      grp_admin: 'المالك فقط',
      // security
      sec_admin_pw: 'كلمة مرور المدير',
      sec_admin_pw_change: 'تغيير كلمة مرور المدير',
      sec_current_pw: 'كلمة المرور الحالية',
      sec_new_pw: 'كلمة المرور الجديدة',
      sec_audit: 'سجل التدقيق',
      sec_audit_filter_action: 'الإجراء',
      sec_audit_filter_actor: 'الموظف',
      sec_audit_filter_apply: 'تطبيق',
      sec_audit_retention: 'يتم الاحتفاظ بسجل التدقيق لمدة سنة واحدة. لا يمكن حذفه.',
      // menu (Sprint 2.1)
      menu_tab_categories: 'الفئات',
      menu_tab_items:      'الأصناف',
      menu_tab_modifiers:  'الإضافات',
      menu_tab_sets:       'مجموعات',
      cat_add:        '+ إضافة فئة',
      cat_code:       'الكود',
      cat_name_en:    'الاسم (إنجليزي)',
      cat_name_ar:    'الاسم (عربي)',
      cat_name_ko:    'الاسم (كوري)',
      cat_icon:       'الرمز',
      cat_color:      'اللون',
      cat_sort:       'الترتيب',
      cat_active:     'نشط',
      cat_in_use_err: 'لا يمكن حذف الفئة لأنها مستخدمة في أصناف القائمة',
      coming_soon:    'قريباً',
      // items (Sprint 2.2)
      item_add:        '+ إضافة صنف',
      item_filter_all: 'كل الفئات',
      item_search:     'بحث بالاسم أو الكود...',
      item_code:       'الكود',
      item_name_en:    'الاسم (إنجليزي)',
      item_name_ar:    'الاسم (عربي)',
      item_name_ko:    'الاسم (كوري)',
      item_emoji:      'إيموجي',
      item_category:   'الفئة',
      item_base_price: 'السعر الأساسي (IQD)',
      item_kind:       'النوع',
      item_kind_single:'صنف فردي',
      item_kind_set:   'مجموعة',
      item_active:     'نشط',
      item_sold_out:   'نفد المخزون',
      item_sort:       'الترتيب',
      item_desc:       'الوصف',
      item_photo:      'الصورة',
      item_no_photo:   'بدون صورة',
      item_upload:     'رفع صورة',
      item_no_items:   'لا توجد أصناف بعد. أضف أول صنف.',
      // modifiers (Sprint 2.3)
      mod_group_add:   '+ إضافة مجموعة إضافات',
      mod_opt_add:     '+ خيار',
      mod_selection:   'الاختيار',
      mod_selection_single: 'فردي',
      mod_selection_multi:  'متعدد',
      mod_required:    'مطلوب',
      mod_options:     'الخيارات',
      mod_opt_default: 'افتراضي',
      mod_opt_delta:   'سعر إضافي (IQD)',
      mod_no_groups:   'لا توجد مجموعات إضافات. أضف أول مجموعة.',
      mod_in_use:      'لا يمكن حذف المجموعة لأنها مستخدمة في أصناف القائمة',
      // item ↔ modifier groups (Sprint 2.4)
      item_mod_groups: 'مجموعات الإضافات',
      item_mod_help:   'حدد الإضافات التي تنطبق على هذا الصنف. اضغط واسحب لإعادة الترتيب.',
      item_no_mod:     'لا توجد مجموعات إضافات بعد',
      // sets (Sprint 2.5)
      sets_intro:      'تظهر مجموعات (kind=set) فقط هنا. غيّر نوع الصنف إلى "مجموعة" في تبويب الأصناف لإضافة مكونات.',
      sets_no_sets:    'لا توجد مجموعات بعد. أنشئ صنفاً بنوع "مجموعة" أولاً.',
      sets_components: 'المكونات',
      sets_add_comp:   '+ إضافة مكون',
      sets_qty:        'الكمية',
      sets_no_comps:   'لا توجد مكونات. أضف العناصر المضمنة في هذه المجموعة.',
      sets_pick_item:  'اختر صنفاً...',
      sets_save:       'حفظ المكونات',
      // manager modal
      mgr_title: 'موافقة المدير مطلوبة',
      mgr_sub: 'الإجراء يتطلب صلاحية أعلى. يرجى تأكيد الموافقة.',
      mgr_name: 'اسم المدير',
      mgr_pw: 'كلمة مرور المدير',
      mgr_reason: 'السبب (مطلوب)',
      mgr_approve: 'موافقة',
      mgr_invalid: 'بيانات المدير غير صحيحة',
      mgr_no_perm: 'المدير لا يملك هذه الصلاحية',
      mgr_reason_required: 'يجب كتابة السبب',
      // force change password
      pw_title: 'يجب تغيير كلمة المرور',
      pw_sub: 'تم إنشاء كلمة المرور هذه من قبل المدير. اختر كلمة مرور جديدة للمتابعة.',
      pw_new: 'كلمة المرور الجديدة (٦ أحرف على الأقل)',
      pw_confirm: 'تأكيد كلمة المرور',
      pw_mismatch: 'كلمتا المرور غير متطابقتين',
      pw_set: 'تعيين'
    },
    en: {
      settings: 'Settings',
      sec_store: 'Store Info',
      sec_staff: 'Staff',
      sec_roles: 'Roles & Permissions',
      sec_menu:  'Menu',
      sec_security: 'Security & Audit',
      store_name_en: 'Store Name (English)',
      store_name_ar: 'Store Name (Arabic)',
      store_address_en: 'Address (English)',
      store_address_ar: 'Address (Arabic)',
      store_phone: 'Phone',
      store_tax_id: 'Tax ID',
      store_logo: 'Logo URL',
      store_hours: 'Operating Hours',
      receipt_footer_en: 'Receipt Footer (English)',
      receipt_footer_ar: 'Receipt Footer (Arabic)',
      save: 'Save',
      cancel: 'Cancel',
      saved_ok: '✓ Saved',
      err_generic: 'Something went wrong. Try again.',
      staff_add: '+ Add Staff',
      staff_name: 'Name',
      staff_email: 'Email',
      staff_phone: 'Phone',
      staff_role: 'Role',
      staff_active: 'Active',
      staff_password: 'Password',
      staff_create: 'Create',
      staff_reset_pw: 'Reset Password',
      staff_delete: 'Delete',
      staff_edit: 'Edit',
      staff_last_login: 'Last login',
      staff_never: 'Never',
      staff_pw_generated: 'Temporary password',
      staff_pw_copy: 'Copy',
      staff_pw_close: 'Close',
      staff_must_change_pw: 'The staff member will be required to change their password on next login.',
      confirm_delete_staff: 'Delete this staff member? This cannot be undone.',
      confirm_reset_pw: 'Reset password? The staff member will be signed out.',
      role_owner: 'Owner', role_manager: 'Manager', role_cashier: 'Cashier', role_barista: 'Barista',
      perm_locked: 'Locked (Owner only)',
      grp_cash: 'Cash & Drawer',
      grp_orders: 'Orders & Refunds',
      grp_discounts: 'Discounts',
      grp_shifts: 'Shifts',
      grp_customers: 'Customers & Stamps',
      grp_menu: 'Menu & Inventory',
      grp_reports: 'Reports & Data',
      grp_admin: 'Owner only',
      sec_admin_pw: 'Admin Password',
      sec_admin_pw_change: 'Change Admin Password',
      sec_current_pw: 'Current Password',
      sec_new_pw: 'New Password',
      sec_audit: 'Audit Log',
      sec_audit_filter_action: 'Action',
      sec_audit_filter_actor: 'Staff',
      sec_audit_filter_apply: 'Apply',
      sec_audit_retention: 'Audit log is retained for 1 year. It cannot be deleted.',
      // menu (Sprint 2.1)
      menu_tab_categories: 'Categories',
      menu_tab_items:      'Items',
      menu_tab_modifiers:  'Modifiers',
      menu_tab_sets:       'Sets',
      cat_add:        '+ Add Category',
      cat_code:       'Code',
      cat_icon:       'Icon',
      cat_name_en:    'Name (English)',
      cat_name_ar:    'Name (Arabic)',
      cat_name_ko:    'Name (Korean)',
      cat_color:      'Color',
      cat_sort:       'Sort order',
      cat_active:     'Active',
      cat_in_use_err: 'Cannot delete: category is in use by menu items',
      coming_soon:    'Coming soon',
      // items (Sprint 2.2)
      item_add:        '+ Add Item',
      item_filter_all: 'All categories',
      item_search:     'Search name or code...',
      item_code:       'Code',
      item_name_en:    'Name (English)',
      item_name_ar:    'Name (Arabic)',
      item_name_ko:    'Name (Korean)',
      item_emoji:      'Emoji',
      item_category:   'Category',
      item_base_price: 'Base price (IQD)',
      item_kind:       'Kind',
      item_kind_single:'Single item',
      item_kind_set:   'Set / Combo',
      item_active:     'Active',
      item_sold_out:   'Sold out',
      item_sort:       'Sort order',
      item_desc:       'Description',
      item_photo:      'Photo',
      item_no_photo:   'No photo',
      item_upload:     'Upload',
      item_no_items:   'No items yet. Add your first item.',
      // modifiers (Sprint 2.3)
      mod_group_add:   '+ Add Modifier Group',
      mod_opt_add:     '+ Option',
      mod_selection:   'Selection',
      mod_selection_single: 'Single',
      mod_selection_multi:  'Multi',
      mod_required:    'Required',
      mod_options:     'Options',
      mod_opt_default: 'Default',
      mod_opt_delta:   'Extra price (IQD)',
      mod_no_groups:   'No modifier groups yet. Add your first group.',
      mod_in_use:      'Cannot delete: group is in use by menu items',
      // item ↔ modifier groups (Sprint 2.4)
      item_mod_groups: 'Modifier Groups',
      item_mod_help:   'Select which modifier groups apply to this item.',
      item_no_mod:     'No modifier groups defined yet',
      // sets (Sprint 2.5)
      sets_intro:      'Only items with kind=set appear here. Change an item\'s kind to "Set" in the Items tab first.',
      sets_no_sets:    'No set items yet. Create an item with kind="Set" first.',
      sets_components: 'Components',
      sets_add_comp:   '+ Add component',
      sets_qty:        'Qty',
      sets_no_comps:   'No components yet. Add items included in this set.',
      sets_pick_item:  'Pick an item...',
      sets_save:       'Save Components',
      mgr_title: 'Manager Approval Required',
      mgr_sub: 'This action requires elevated permission. Please confirm.',
      mgr_name: 'Manager Name',
      mgr_pw: 'Manager Password',
      mgr_reason: 'Reason (required)',
      mgr_approve: 'Approve',
      mgr_invalid: 'Invalid manager credentials',
      mgr_no_perm: 'Manager lacks this permission',
      mgr_reason_required: 'Reason is required',
      pw_title: 'Password Change Required',
      pw_sub: 'This password was issued by the admin. Please choose a new one to continue.',
      pw_new: 'New password (min 6 chars)',
      pw_confirm: 'Confirm password',
      pw_mismatch: 'Passwords do not match',
      pw_set: 'Set'
    }
  };

  // Permission code grouping for the matrix UI. Order matters — this is the
  // order rows appear in the editor. "limit"-suffixed numeric codes ride with
  // their boolean partner (handled in renderRoles).
  const PERM_GROUPS = [
    { key: 'grp_cash', codes: [
      'cash_drawer_open_no_sale', 'cash_deposit', 'cash_withdraw', 'change_payment_method'
    ] },
    { key: 'grp_orders', codes: [
      'void_before_payment', 'void_after_payment',
      { code: 'refund', limit: 'refund_max_iqd', limit_unit: 'IQD' },
      'reopen_closed_order', 'transfer_order', 'merge_split_orders',
      'kitchen_recall', 'comp_item', 'assign_to_other_cashier'
    ] },
    { key: 'grp_discounts', codes: [
      { code: 'discount_percent', limit: 'discount_percent_max', limit_unit: '%' },
      { code: 'discount_fixed', limit: 'discount_fixed_max_iqd', limit_unit: 'IQD' },
      'discount_employee_meal',
      { code: 'discount_daily_count_limit', is_limit_only: true, limit_unit: '/day' },
      'price_override', 'gift_voucher_issue', 'tip_adjust'
    ] },
    { key: 'grp_shifts', codes: [
      'open_shift', 'close_shift', 'close_shift_force', 'view_other_cashier_sales'
    ] },
    { key: 'grp_customers', codes: [
      'customer_data_view', 'customer_data_edit', 'customer_delete', 'stamp_manual_grant'
    ] },
    { key: 'grp_menu', codes: [
      'menu_edit', 'menu_sold_out_toggle', 'inventory_edit', 'inventory_count'
    ] },
    { key: 'grp_reports', codes: [
      'view_basic_reports', 'view_advanced_reports', 'view_cost_margin',
      'view_payroll', 'export_data'
    ] },
    { key: 'grp_admin', codes: [
      'settings_change', 'staff_manage', 'role_manage', 'view_audit_log',
      'manage_pg_keys', 'database_export', 'factory_reset'
    ], owner_only: true }
  ];
  const ADMIN_ONLY_CODES = new Set(PERM_GROUPS.find(g => g.owner_only).codes);

  // Per-permission human label fallbacks (used when no specific i18n key).
  // Keep tight — the code itself is also human-readable.
  function permLabel(code, lang) {
    const map = {
      cash_drawer_open_no_sale: { en: 'Open drawer without sale', ar: 'فتح الصندوق بدون عملية بيع' },
      cash_deposit:             { en: 'Cash deposit (drop)',       ar: 'إيداع نقدي' },
      cash_withdraw:            { en: 'Cash withdraw (payout)',    ar: 'سحب نقدي' },
      change_payment_method:    { en: 'Change payment method after sale', ar: 'تغيير طريقة الدفع بعد البيع' },
      void_before_payment:      { en: 'Void order before payment', ar: 'إلغاء طلب قبل الدفع' },
      void_after_payment:       { en: 'Void order after payment',  ar: 'إلغاء طلب بعد الدفع' },
      refund:                   { en: 'Refund',                    ar: 'استرداد' },
      refund_max_iqd:           { en: 'Refund max (IQD)',          ar: 'الحد الأقصى للاسترداد' },
      reopen_closed_order:      { en: 'Reopen closed order',       ar: 'إعادة فتح طلب مغلق' },
      transfer_order:           { en: 'Transfer order between tables', ar: 'نقل طلب بين الطاولات' },
      merge_split_orders:       { en: 'Merge / split orders',      ar: 'دمج / تقسيم الطلبات' },
      kitchen_recall:           { en: 'Recall ticket from kitchen', ar: 'استرجاع تذكرة من المطبخ' },
      comp_item:                { en: 'Comp item (free of charge)', ar: 'تقديم مجاني' },
      assign_to_other_cashier:  { en: 'Assign order to other cashier', ar: 'تخصيص طلب لكاشير آخر' },
      discount_percent:         { en: 'Percent discount',          ar: 'خصم نسبي' },
      discount_percent_max:     { en: 'Max percent (%)',           ar: 'الحد الأقصى للنسبة' },
      discount_fixed:           { en: 'Fixed amount discount',     ar: 'خصم مبلغ ثابت' },
      discount_fixed_max_iqd:   { en: 'Max fixed amount (IQD)',    ar: 'الحد الأقصى للمبلغ' },
      discount_employee_meal:   { en: 'Employee meal discount',    ar: 'خصم وجبة الموظفين' },
      discount_daily_count_limit: { en: 'Discount daily count limit', ar: 'حد عدد الخصومات اليومي' },
      price_override:           { en: 'Override item price',       ar: 'تعديل سعر صنف' },
      gift_voucher_issue:       { en: 'Issue gift voucher',        ar: 'إصدار قسيمة' },
      tip_adjust:               { en: 'Adjust tip',                ar: 'تعديل البقشيش' },
      open_shift:               { en: 'Open shift',                ar: 'فتح وردية' },
      close_shift:              { en: 'Close shift',               ar: 'إغلاق وردية' },
      close_shift_force:        { en: 'Force-close shift with variance', ar: 'إغلاق إجباري مع وجود فرق' },
      view_other_cashier_sales: { en: 'View other cashier sales',  ar: 'عرض مبيعات كاشير آخر' },
      customer_data_view:       { en: 'View customer info',        ar: 'عرض بيانات العميل' },
      customer_data_edit:       { en: 'Edit customer info',        ar: 'تعديل بيانات العميل' },
      customer_delete:          { en: 'Delete customer',           ar: 'حذف عميل' },
      stamp_manual_grant:       { en: 'Manually grant stamps',     ar: 'منح طوابع يدوياً' },
      menu_edit:                { en: 'Edit menu',                 ar: 'تعديل القائمة' },
      menu_sold_out_toggle:     { en: 'Toggle sold-out',           ar: 'تبديل نفاد الصنف' },
      inventory_edit:           { en: 'Edit inventory',            ar: 'تعديل المخزون' },
      inventory_count:          { en: 'Inventory count',           ar: 'جرد المخزون' },
      view_basic_reports:       { en: 'View basic reports',        ar: 'عرض التقارير الأساسية' },
      view_advanced_reports:    { en: 'View advanced reports',     ar: 'عرض التقارير المتقدمة' },
      view_cost_margin:         { en: 'View cost & margin',        ar: 'عرض التكلفة والهامش' },
      view_payroll:             { en: 'View payroll',              ar: 'عرض الرواتب' },
      export_data:              { en: 'Export data (CSV/Excel)',   ar: 'تصدير البيانات' },
      settings_change:          { en: 'Change settings',           ar: 'تغيير الإعدادات' },
      staff_manage:             { en: 'Manage staff',              ar: 'إدارة الموظفين' },
      role_manage:              { en: 'Manage roles',              ar: 'إدارة الأدوار' },
      view_audit_log:           { en: 'View audit log',            ar: 'عرض سجل التدقيق' },
      manage_pg_keys:           { en: 'Manage payment gateway keys', ar: 'إدارة مفاتيح الدفع' },
      database_export:          { en: 'Database export',           ar: 'تصدير قاعدة البيانات' },
      factory_reset:            { en: 'Factory reset',             ar: 'إعادة ضبط المصنع' }
    };
    const e = map[code];
    if (!e) return code;
    return e[lang] || e.en || code;
  }

  // ── shared state ───────────────────────────────────────────────────────
  const S = {
    activeSection: 'store',
    me: null,            // { id, name, role, role_id, permissions, isAdmin }
    roles: null,         // [{id, code, name_en, name_ar, permissions, is_system}, ...]
    staff: null,         // [{id, name, role, ...}, ...]
    permissionCodes: null,
    currentLang: () => (window.MK?.STATE?.lang === 'ar') ? 'ar' : 'en'
  };

  function lang() { return S.currentLang(); }
  function tr(key) {
    const dict = SETTINGS_I18N[lang()] || SETTINGS_I18N.en;
    return dict[key] || (SETTINGS_I18N.en[key] || key);
  }

  // Cashier-token-aware fetch (server promotes owner cashiers to admin endpoints).
  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    const tok = localStorage.getItem('cashierToken');
    if (tok) headers['x-cashier-token'] = tok;
    const r = await fetch(path, { ...opts, headers });
    let body = null;
    try { body = await r.json(); } catch (_) { body = null; }
    if (!r.ok) {
      const err = new Error((body && body.error) || `HTTP ${r.status}`);
      err.status = r.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  // toast bridge — falls back to alert if MKO.toast unavailable
  function toast(msg, kind) {
    if (window.MKO?.toast) return window.MKO.toast(msg, kind || 'ok');
    // eslint-disable-next-line no-alert
    alert(msg);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ── boot: called once after login by cashier.html ──────────────────────
  async function init() {
    try {
      S.me = await api('/api/cashier/me');
    } catch (e) {
      // not logged in or token invalid — caller will redirect to login
      return;
    }
    // hide settings sidebar button for non-owner
    const btn = document.querySelector('.sbn[data-v="settings"]');
    if (btn) btn.style.display = (S.me.role === 'owner') ? '' : 'none';

    // if must_change_pw flag is set on session (we keep a localStorage flag
    // populated by the login flow), force the change-password modal first.
    if (localStorage.getItem('must_change_pw') === '1') {
      openForceChangePw();
    }
  }

  // Called by MKApp.nav('settings').
  function open() {
    if (S.me?.role !== 'owner') {
      toast('Owner only', 'warn');
      return;
    }
    renderShell();
    showSection(S.activeSection);
  }

  function renderShell() {
    const root = document.getElementById('v-settings');
    if (!root) return;
    const sections = [
      { key: 'store',    label: tr('sec_store'),    icon: '🏪' },
      { key: 'staff',    label: tr('sec_staff'),    icon: '👥' },
      { key: 'roles',    label: tr('sec_roles'),    icon: '🛡️' },
      { key: 'menu',     label: tr('sec_menu'),     icon: '📋' },
      { key: 'security', label: tr('sec_security'), icon: '🔐' }
    ];
    root.innerHTML = `
      <div class="set-shell">
        <nav class="set-nav" id="set-nav">
          <h4>${tr('settings')}</h4>
          ${sections.map(s => `
            <button data-sec="${s.key}" onclick="MKS.showSection('${s.key}')">
              <span class="ic">${s.icon}</span>
              <span class="lbl">${escapeHtml(s.label)}</span>
            </button>
          `).join('')}
        </nav>
        <div class="set-pane" id="set-pane"></div>
      </div>
    `;
  }

  function showSection(key) {
    S.activeSection = key;
    document.querySelectorAll('#set-nav button').forEach(b => {
      b.classList.toggle('on', b.dataset.sec === key);
    });
    if (key === 'store')         renderStore();
    else if (key === 'staff')    renderStaff();
    else if (key === 'roles')    renderRoles();
    else if (key === 'menu')     renderMenu();
    else if (key === 'security') renderSecurity();
  }

  // =============================================================
  // SECTION: STORE INFO
  // =============================================================
  async function renderStore() {
    const pane = document.getElementById('set-pane');
    pane.innerHTML = `<div style="padding:40px;text-align:center;opacity:0.5">Loading…</div>`;
    let info;
    try { info = await api('/api/admin/settings/store'); }
    catch (e) { pane.innerHTML = `<div style="color:#ff7070">${escapeHtml(e.message)}</div>`; return; }

    const days = ['mon','tue','wed','thu','fri','sat','sun'];
    const dayLabel = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' };
    const hours = info.hours || {};

    pane.innerHTML = `
      <header>
        <h2>${tr('sec_store')}</h2>
        <span class="desc">${escapeHtml(info.name_en || '')}</span>
      </header>

      <div class="set-card">
        <h3>Identity</h3>
        <div class="set-row"><label>${tr('store_name_en')}</label><div class="ctl"><input id="s-name-en" type="text" value="${escapeHtml(info.name_en||'')}"></div></div>
        <div class="set-row"><label>${tr('store_name_ar')}</label><div class="ctl"><input id="s-name-ar" type="text" dir="rtl" value="${escapeHtml(info.name_ar||'')}"></div></div>
        <div class="set-row"><label>${tr('store_address_en')}</label><div class="ctl"><input id="s-addr-en" type="text" value="${escapeHtml(info.address_en||'')}"></div></div>
        <div class="set-row"><label>${tr('store_address_ar')}</label><div class="ctl"><input id="s-addr-ar" type="text" dir="rtl" value="${escapeHtml(info.address_ar||'')}"></div></div>
        <div class="set-row"><label>${tr('store_phone')}</label><div class="ctl"><input id="s-phone" type="tel" value="${escapeHtml(info.phone||'')}"></div></div>
        <div class="set-row"><label>${tr('store_tax_id')}</label><div class="ctl"><input id="s-tax-id" type="text" value="${escapeHtml(info.tax_id||'')}"></div></div>
        <div class="set-row"><label>${tr('store_logo')}</label><div class="ctl"><input id="s-logo" type="text" value="${escapeHtml(info.logo_url||'')}"></div></div>
      </div>

      <div class="set-card">
        <h3>${tr('store_hours')}</h3>
        ${days.map(d => {
          const h = hours[d] || { open:'08:00', close:'23:00', closed:false };
          return `
            <div class="set-row" data-day="${d}">
              <label>${dayLabel[d]}</label>
              <div class="ctl" style="display:flex;gap:10px;align-items:center">
                <label style="display:flex;gap:6px;align-items:center;font-size:12px">
                  <input type="checkbox" class="hr-closed" ${h.closed?'checked':''}> Closed
                </label>
                <input type="time" class="hr-open" value="${escapeHtml(h.open||'08:00')}" ${h.closed?'disabled':''}>
                <span style="opacity:.5">→</span>
                <input type="time" class="hr-close" value="${escapeHtml(h.close||'23:00')}" ${h.closed?'disabled':''}>
              </div>
            </div>`;
        }).join('')}
      </div>

      <div class="set-card">
        <h3>Receipt Footer</h3>
        <div class="set-row"><label>${tr('receipt_footer_en')}</label><div class="ctl"><textarea id="s-rcpt-en">${escapeHtml(info.receipt_footer_en||'')}</textarea></div></div>
        <div class="set-row"><label>${tr('receipt_footer_ar')}</label><div class="ctl"><textarea id="s-rcpt-ar" dir="rtl">${escapeHtml(info.receipt_footer_ar||'')}</textarea></div></div>
      </div>

      <div class="set-actions">
        <button class="set-btn primary" id="s-save">${tr('save')}</button>
      </div>
    `;
    // toggle disabled state when "Closed" is ticked
    pane.querySelectorAll('.hr-closed').forEach(cb => {
      cb.addEventListener('change', e => {
        const row = e.target.closest('[data-day]');
        row.querySelector('.hr-open').disabled  = e.target.checked;
        row.querySelector('.hr-close').disabled = e.target.checked;
      });
    });
    document.getElementById('s-save').addEventListener('click', saveStore);
  }

  async function saveStore() {
    const days = ['mon','tue','wed','thu','fri','sat','sun'];
    const hours = {};
    for (const d of days) {
      const row = document.querySelector(`[data-day="${d}"]`);
      hours[d] = {
        open:   row.querySelector('.hr-open').value,
        close:  row.querySelector('.hr-close').value,
        closed: row.querySelector('.hr-closed').checked
      };
    }
    const body = {
      name_en:    document.getElementById('s-name-en').value.trim(),
      name_ar:    document.getElementById('s-name-ar').value.trim(),
      address_en: document.getElementById('s-addr-en').value.trim(),
      address_ar: document.getElementById('s-addr-ar').value.trim(),
      phone:      document.getElementById('s-phone').value.trim(),
      tax_id:     document.getElementById('s-tax-id').value.trim(),
      logo_url:   document.getElementById('s-logo').value.trim(),
      hours,
      receipt_footer_en: document.getElementById('s-rcpt-en').value,
      receipt_footer_ar: document.getElementById('s-rcpt-ar').value
    };
    const btn = document.getElementById('s-save');
    btn.disabled = true;
    try {
      await api('/api/admin/settings/store', { method: 'PUT', body: JSON.stringify(body) });
      toast(tr('saved_ok'), 'ok');
    } catch (e) {
      toast(e.message || tr('err_generic'), 'err');
    } finally {
      btn.disabled = false;
    }
  }

  // =============================================================
  // SECTION: STAFF
  // =============================================================
  async function renderStaff() {
    const pane = document.getElementById('set-pane');
    pane.innerHTML = `<div style="padding:40px;text-align:center;opacity:0.5">Loading…</div>`;
    let staff, roles;
    try {
      [staff, roles] = await Promise.all([
        api('/api/admin/staff'),
        api('/api/admin/roles')
      ]);
    } catch (e) {
      pane.innerHTML = `<div style="color:#ff7070">${escapeHtml(e.message)}</div>`;
      return;
    }
    S.staff = staff; S.roles = roles;
    const lng = lang();

    pane.innerHTML = `
      <header>
        <h2>${tr('sec_staff')}</h2>
        <span class="desc">${staff.length} total</span>
        <div class="spacer"></div>
        <button class="set-btn primary" onclick="MKS.openStaffCreate()">${tr('staff_add')}</button>
      </header>
      <div class="set-card">
        <table class="staff-tbl">
          <thead><tr>
            <th>${tr('staff_name')}</th>
            <th>${tr('staff_role')}</th>
            <th>${tr('staff_email')}</th>
            <th>${tr('staff_phone')}</th>
            <th>${tr('staff_last_login')}</th>
            <th>${tr('staff_active')}</th>
            <th style="text-align:end"></th>
          </tr></thead>
          <tbody>
            ${staff.map(s => {
              const role = roles.find(r => r.id === s.role_id) || roles.find(r => r.code === s.role) || {};
              const roleLabel = (lng === 'ar' ? role.name_ar : role.name_en) || s.role || 'cashier';
              const lastLogin = s.last_login_at ? new Date(s.last_login_at).toLocaleString() : tr('staff_never');
              return `
                <tr class="${s.active ? '' : 'inactive'}">
                  <td><strong>${escapeHtml(s.name)}</strong>${s.must_change_pw ? ' <span style="color:#ffd06e;font-size:11px">⚠ pw</span>' : ''}</td>
                  <td><span class="role-badge role-${role.code||s.role||'cashier'}">${escapeHtml(roleLabel)}</span></td>
                  <td>${escapeHtml(s.email||'')}</td>
                  <td>${escapeHtml(s.phone||'')}</td>
                  <td style="font-size:11px;opacity:.7">${escapeHtml(lastLogin)}</td>
                  <td>${s.active ? '✓' : '—'}</td>
                  <td>
                    <div class="row-acts">
                      <button onclick="MKS.openStaffEdit(${s.id})">${tr('staff_edit')}</button>
                      <button onclick="MKS.resetStaffPw(${s.id})">${tr('staff_reset_pw')}</button>
                      <button class="danger" onclick="MKS.deleteStaff(${s.id})">${tr('staff_delete')}</button>
                    </div>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function staffEditorHtml(s, isCreate) {
    const lng = lang();
    const opts = (S.roles || []).map(r => {
      const lbl = lng === 'ar' ? r.name_ar : r.name_en;
      const sel = (s && s.role_id === r.id) ? 'selected' : '';
      return `<option value="${r.id}" ${sel}>${escapeHtml(lbl)}</option>`;
    }).join('');
    return `
      <div class="set-card">
        <h3>${isCreate ? tr('staff_add') : tr('staff_edit')} ${s ? '— ' + escapeHtml(s.name) : ''}</h3>
        <div class="set-row"><label>${tr('staff_name')}</label><div class="ctl"><input id="se-name" type="text" value="${escapeHtml(s?.name||'')}" ${isCreate?'':'readonly'}></div></div>
        <div class="set-row"><label>${tr('staff_role')}</label><div class="ctl"><select id="se-role">${opts}</select></div></div>
        <div class="set-row"><label>${tr('staff_email')}</label><div class="ctl"><input id="se-email" type="email" value="${escapeHtml(s?.email||'')}"></div></div>
        <div class="set-row"><label>${tr('staff_phone')}</label><div class="ctl"><input id="se-phone" type="tel" value="${escapeHtml(s?.phone||'')}"></div></div>
        <div class="set-row"><label>${tr('staff_active')}</label><div class="ctl"><label style="display:flex;gap:6px;align-items:center"><input id="se-active" type="checkbox" ${(!s || s.active) ? 'checked' : ''}> ${tr('staff_active')}</label></div></div>
        ${isCreate ? `
          <div class="set-row"><label>${tr('staff_password')}</label><div class="ctl"><input id="se-pw" type="text" value="${randomPw()}"></div></div>
          <div style="margin-inline-start:200px;font-size:11px;opacity:.6">${tr('staff_must_change_pw')}</div>
        ` : ''}
      </div>
      <div class="set-actions">
        <button class="set-btn" onclick="MKS.showSection('staff')">${tr('cancel')}</button>
        <button class="set-btn primary" id="se-save">${isCreate ? tr('staff_create') : tr('save')}</button>
      </div>
    `;
  }

  function randomPw() {
    const a = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < 10; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }

  function openStaffCreate() {
    const pane = document.getElementById('set-pane');
    pane.innerHTML = `<header><h2>${tr('sec_staff')}</h2></header>` + staffEditorHtml(null, true);
    document.getElementById('se-save').addEventListener('click', async () => {
      const body = {
        name:     document.getElementById('se-name').value.trim(),
        role_id:  parseInt(document.getElementById('se-role').value, 10),
        email:    document.getElementById('se-email').value.trim() || null,
        phone:    document.getElementById('se-phone').value.trim() || null,
        active:   document.getElementById('se-active').checked,
        password: document.getElementById('se-pw').value
      };
      try {
        const r = await api('/api/admin/staff', { method:'POST', body: JSON.stringify(body) });
        showStaffPwResult(body.password, body.name);
        S.staff = null;
      } catch (e) {
        toast(e.message || tr('err_generic'), 'err');
      }
    });
  }

  function showStaffPwResult(pw, name) {
    const pane = document.getElementById('set-pane');
    pane.innerHTML = `
      <header><h2>${tr('sec_staff')}</h2></header>
      <div class="set-card" style="max-width:520px">
        <h3>✓ ${escapeHtml(name)}</h3>
        <p style="color:rgba(255,255,255,.7);font-size:13px">${tr('staff_pw_generated')}:</p>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="text" id="pw-out" readonly value="${escapeHtml(pw)}" style="flex:1;padding:10px;font-family:ui-monospace,Menlo,monospace;font-size:14px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#fff">
          <button class="set-btn" onclick="navigator.clipboard.writeText(document.getElementById('pw-out').value);MKS._toast('Copied','ok')">${tr('staff_pw_copy')}</button>
        </div>
        <p style="font-size:11px;opacity:.6;margin-top:12px">${tr('staff_must_change_pw')}</p>
      </div>
      <div class="set-actions">
        <button class="set-btn primary" onclick="MKS.showSection('staff')">${tr('staff_pw_close')}</button>
      </div>
    `;
  }

  function openStaffEdit(id) {
    const s = (S.staff || []).find(x => x.id === id);
    if (!s) { showSection('staff'); return; }
    const pane = document.getElementById('set-pane');
    pane.innerHTML = `<header><h2>${tr('sec_staff')}</h2></header>` + staffEditorHtml(s, false);
    document.getElementById('se-save').addEventListener('click', async () => {
      const body = {
        role_id: parseInt(document.getElementById('se-role').value, 10),
        email:   document.getElementById('se-email').value.trim() || null,
        phone:   document.getElementById('se-phone').value.trim() || null,
        active:  document.getElementById('se-active').checked
      };
      try {
        await api('/api/admin/staff/' + id, { method:'PUT', body: JSON.stringify(body) });
        toast(tr('saved_ok'), 'ok');
        S.staff = null;
        showSection('staff');
      } catch (e) {
        toast(e.message || tr('err_generic'), 'err');
      }
    });
  }

  async function resetStaffPw(id) {
    if (!confirm(tr('confirm_reset_pw'))) return;
    try {
      const r = await api('/api/admin/staff/' + id + '/reset-password', { method:'POST', body: '{}' });
      const s = (S.staff || []).find(x => x.id === id);
      showStaffPwResult(r.new_password, s?.name || '#' + id);
    } catch (e) {
      toast(e.message || tr('err_generic'), 'err');
    }
  }

  async function deleteStaff(id) {
    if (!confirm(tr('confirm_delete_staff'))) return;
    try {
      await api('/api/admin/staff/' + id, { method:'DELETE' });
      toast(tr('saved_ok'), 'ok');
      S.staff = null;
      showSection('staff');
    } catch (e) {
      toast(e.message || tr('err_generic'), 'err');
    }
  }

  // =============================================================
  // SECTION: ROLES & PERMISSIONS MATRIX
  // =============================================================
  async function renderRoles() {
    const pane = document.getElementById('set-pane');
    pane.innerHTML = `<div style="padding:40px;text-align:center;opacity:0.5">Loading…</div>`;
    let roles, codesResp;
    try {
      [roles, codesResp] = await Promise.all([
        api('/api/admin/roles'),
        api('/api/admin/permission-codes')
      ]);
    } catch (e) { pane.innerHTML = `<div style="color:#ff7070">${escapeHtml(e.message)}</div>`; return; }
    S.roles = roles; S.permissionCodes = codesResp.codes;
    const lng = lang();

    // canonical display order: owner, manager, cashier, barista
    const ORDER = ['owner','manager','cashier','barista'];
    const cols = ORDER.map(code => roles.find(r => r.code === code)).filter(Boolean);
    const colHeader = cols.map(r => `<div class="h">${escapeHtml(lng==='ar' ? r.name_ar : r.name_en)}</div>`).join('');

    let body = '';
    for (const grp of PERM_GROUPS) {
      body += `<div class="lbl group" style="grid-column: 1 / -1">${escapeHtml(tr(grp.key))}</div>`;
      for (const entry of grp.codes) {
        const isObj = typeof entry === 'object';
        const code = isObj ? entry.code : entry;
        const limitCode = isObj ? entry.limit : null;
        const limitUnit = isObj ? entry.limit_unit : null;
        const isLimitOnly = isObj && entry.is_limit_only;
        body += `<div class="lbl">${escapeHtml(permLabel(code, lng))}${limitUnit ? ` <span style="opacity:.45;font-size:10px">(${escapeHtml(limitUnit)})</span>` : ''}</div>`;
        for (const role of cols) {
          const locked = role.code !== 'owner' && ADMIN_ONLY_CODES.has(code);
          const v = role.permissions[code];
          if (isLimitOnly) {
            body += `<div class="${locked?'locked':''}">
              <input type="number" data-role="${role.code}" data-code="${code}" value="${Number.isFinite(v)?v:0}" min="0" ${locked||role.code==='owner'?'disabled':''}>
            </div>`;
          } else {
            const checked = (v === true) ? 'checked' : '';
            const dis = (locked || role.code === 'owner') ? 'disabled' : '';
            body += `<div class="${locked?'locked':''}">
              <input type="checkbox" data-role="${role.code}" data-code="${code}" ${checked} ${dis}>
            </div>`;
          }
        }
        if (limitCode) {
          body += `<div class="lbl" style="padding-inline-start:32px;opacity:.7">↳ ${escapeHtml(permLabel(limitCode, lng))}</div>`;
          for (const role of cols) {
            const v = role.permissions[limitCode];
            const dis = role.code === 'owner' ? 'disabled' : '';
            body += `<div><input type="number" data-role="${role.code}" data-code="${limitCode}" value="${Number.isFinite(v)?v:0}" min="0" ${dis}></div>`;
          }
        }
      }
    }

    pane.innerHTML = `
      <header>
        <h2>${tr('sec_roles')}</h2>
        <span class="desc">${tr('perm_locked')}</span>
        <div class="spacer"></div>
        <button class="set-btn primary" id="r-save">${tr('save')}</button>
      </header>
      <div class="set-card">
        <div class="perm-grid">
          <div class="h"></div>
          ${colHeader}
          ${body}
        </div>
      </div>
    `;
    document.getElementById('r-save').addEventListener('click', saveRoles);
  }

  async function saveRoles() {
    const inputs = document.querySelectorAll('.perm-grid input[data-role]');
    const byRole = {}; // { roleCode: { code: value } }
    inputs.forEach(el => {
      const r = el.dataset.role, c = el.dataset.code;
      if (el.disabled) return; // owner is read-only here; admin-locked are also disabled for non-owner
      if (!byRole[r]) byRole[r] = {};
      if (el.type === 'checkbox') byRole[r][c] = el.checked;
      else byRole[r][c] = parseInt(el.value, 10) || 0;
    });
    try {
      for (const role of S.roles) {
        if (role.code === 'owner') continue; // owner not editable
        const updates = byRole[role.code] || {};
        const merged = { ...role.permissions, ...updates };
        await api('/api/admin/roles/' + role.id, { method:'PUT', body: JSON.stringify({ permissions: merged }) });
      }
      toast(tr('saved_ok'), 'ok');
    } catch (e) {
      toast(e.message || tr('err_generic'), 'err');
    }
  }

  // =============================================================
  // SECTION: MENU (Sprint 2.1 — categories only; items/modifiers/sets later)
  // =============================================================
  let _menuActiveTab = 'categories';

  async function renderMenu() {
    const pane = document.getElementById('set-pane');
    pane.innerHTML = `
      <header>
        <h2>${tr('sec_menu')}</h2>
        <div class="spacer"></div>
      </header>
      <div class="set-card" style="padding:0">
        <div class="menu-tabs" style="display:flex;border-bottom:1px solid rgba(255,255,255,.06);padding:0 12px">
          ${[
            ['categories', 'menu_tab_categories'],
            ['items',      'menu_tab_items'],
            ['modifiers',  'menu_tab_modifiers'],
            ['sets',       'menu_tab_sets']
          ].map(([k, lblKey]) => `
            <button class="menu-tab ${_menuActiveTab===k?'on':''}" data-tab="${k}"
              onclick="MKS._switchMenuTab('${k}')"
              style="padding:12px 18px;background:transparent;border:0;color:${_menuActiveTab===k?'#fff':'rgba(255,255,255,.55)'};font-weight:${_menuActiveTab===k?'700':'500'};font-size:13px;cursor:pointer;border-bottom:2px solid ${_menuActiveTab===k?'#2a72ff':'transparent'};margin-bottom:-1px">
              ${escapeHtml(tr(lblKey))}
            </button>
          `).join('')}
        </div>
        <div id="menu-tab-body" style="padding:24px"></div>
      </div>
    `;
    await renderMenuTab();
  }

  function _switchMenuTab(tab) {
    _menuActiveTab = tab;
    renderMenu();
  }

  async function renderMenuTab() {
    if (_menuActiveTab === 'categories') return renderMenuCategories();
    if (_menuActiveTab === 'items')      return renderMenuItems();
    if (_menuActiveTab === 'modifiers')  return renderMenuModifiers();
    if (_menuActiveTab === 'sets')       return renderMenuSets();
    const body = document.getElementById('menu-tab-body');
    if (body) body.innerHTML = `<div style="opacity:.5;text-align:center;padding:60px 0;font-size:13px">${tr('coming_soon')}</div>`;
  }

  async function renderMenuCategories() {
    const body = document.getElementById('menu-tab-body');
    body.innerHTML = `<div style="opacity:.5">Loading…</div>`;
    let rows;
    try { rows = await api('/api/admin/menu/categories'); }
    catch (e) { body.innerHTML = `<div style="color:#ff7070">${escapeHtml(e.message)}</div>`; return; }

    body.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        <button class="set-btn primary" onclick="MKS._catEdit(null)">${tr('cat_add')}</button>
      </div>
      <table class="staff-tbl">
        <thead><tr>
          <th>${tr('cat_sort')}</th>
          <th>${tr('cat_icon')}</th>
          <th>${tr('cat_code')}</th>
          <th>${tr('cat_name_en')}</th>
          <th>${tr('cat_name_ar')}</th>
          <th>${tr('cat_name_ko')}</th>
          <th>${tr('cat_color')}</th>
          <th>${tr('cat_active')}</th>
          <th></th>
        </tr></thead>
        <tbody>
          ${rows.map(c => `
            <tr class="${c.active?'':'inactive'}">
              <td style="opacity:.7">${c.sort_order}</td>
              <td style="font-size:18px;text-align:center">${escapeHtml(c.icon||'')||'<span style="opacity:.3">—</span>'}</td>
              <td><code style="font-family:ui-monospace,Menlo,monospace;font-size:11px;padding:2px 6px;background:rgba(255,255,255,.06);border-radius:4px">${escapeHtml(c.code)}</code></td>
              <td><strong>${escapeHtml(c.name_en)}</strong></td>
              <td dir="rtl">${escapeHtml(c.name_ar||'')}</td>
              <td>${escapeHtml(c.name_ko||'')}</td>
              <td>${c.color?`<span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:${escapeHtml(c.color)};vertical-align:middle"></span> <span style="opacity:.6;font-size:11px">${escapeHtml(c.color)}</span>`:'<span style="opacity:.4">—</span>'}</td>
              <td>${c.active?'✓':'—'}</td>
              <td>
                <div class="row-acts">
                  <button onclick="MKS._catEdit(${c.id})">${tr('staff_edit')}</button>
                  <button class="danger" onclick="MKS._catDelete(${c.id})">${tr('staff_delete')}</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    `;
    S._categoriesCache = rows;
  }

  function _catEdit(id) {
    const isCreate = !id;
    const c = isCreate ? null : (S._categoriesCache || []).find(x => x.id === id);
    if (!isCreate && !c) return;
    const body = document.getElementById('menu-tab-body');
    body.innerHTML = `
      <div class="set-card" style="margin:0">
        <h3>${isCreate ? tr('cat_add') : (tr('staff_edit') + ' — ' + escapeHtml(c.name_en))}</h3>
        <div class="set-row"><label>${tr('cat_code')}</label>
          <div class="ctl"><input id="ce-code" type="text" value="${escapeHtml(c?.code||'')}" ${isCreate?'':'readonly'} maxlength="32" pattern="[a-z0-9_-]+"></div>
        </div>
        <div class="set-row"><label>${tr('cat_icon')}</label>
          <div class="ctl"><input id="ce-icon" type="text" value="${escapeHtml(c?.icon||'')}" maxlength="8" placeholder="☕ 🍰 🥤" style="max-width:80px;font-size:18px;text-align:center"></div>
        </div>
        <div class="set-row"><label>${tr('cat_name_en')} *</label>
          <div class="ctl"><input id="ce-name-en" type="text" value="${escapeHtml(c?.name_en||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('cat_name_ar')} *</label>
          <div class="ctl"><input id="ce-name-ar" type="text" dir="rtl" value="${escapeHtml(c?.name_ar||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('cat_name_ko')}</label>
          <div class="ctl"><input id="ce-name-ko" type="text" value="${escapeHtml(c?.name_ko||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('cat_color')}</label>
          <div class="ctl"><input id="ce-color" type="color" value="${escapeHtml(c?.color||'#888888')}" style="width:64px;height:36px;padding:2px;border:1px solid rgba(255,255,255,.1);border-radius:6px;background:rgba(0,0,0,.3)"></div>
        </div>
        <div class="set-row"><label>${tr('cat_sort')}</label>
          <div class="ctl"><input id="ce-sort" type="number" min="0" value="${c?.sort_order ?? 100}" style="max-width:120px"></div>
        </div>
        <div class="set-row"><label>${tr('cat_active')}</label>
          <div class="ctl"><label style="display:flex;gap:6px;align-items:center"><input id="ce-active" type="checkbox" ${(!c || c.active) ? 'checked' : ''}> ${tr('cat_active')}</label></div>
        </div>
      </div>
      <div class="set-actions">
        <button class="set-btn" onclick="MKS._switchMenuTab('categories')">${tr('cancel')}</button>
        <button class="set-btn primary" id="ce-save">${isCreate ? tr('staff_create') : tr('save')}</button>
      </div>
    `;
    document.getElementById('ce-save').addEventListener('click', async () => {
      const nameEn = document.getElementById('ce-name-en').value.trim();
      const nameAr = document.getElementById('ce-name-ar').value.trim();
      // Sprint 2.7+ (D): client-side guard for the Arabic name. Server enforces
      // it too; this is just to surface a friendlier error before the round-trip.
      if (!nameEn) { toast(tr('cat_name_en') + ' ✗', 'err'); return; }
      if (!nameAr) { toast(tr('cat_name_ar') + ' ✗', 'err'); return; }
      const payload = {
        name_en:    nameEn,
        name_ar:    nameAr,
        name_ko:    document.getElementById('ce-name-ko').value.trim(),
        icon:       document.getElementById('ce-icon').value.trim(),
        color:      document.getElementById('ce-color').value,
        sort_order: parseInt(document.getElementById('ce-sort').value, 10) || 100,
        active:     document.getElementById('ce-active').checked
      };
      if (isCreate) payload.code = document.getElementById('ce-code').value.trim().toLowerCase();
      try {
        if (isCreate) {
          await api('/api/admin/menu/categories', { method:'POST', body: JSON.stringify(payload) });
        } else {
          await api('/api/admin/menu/categories/' + c.id, { method:'PUT', body: JSON.stringify(payload) });
        }
        toast(tr('saved_ok'), 'ok');
        S._categoriesCache = null;
        _switchMenuTab('categories');
      } catch (e) {
        toast(e.body?.error || e.message || tr('err_generic'), 'err');
      }
    });
  }

  async function _catDelete(id) {
    const c = (S._categoriesCache || []).find(x => x.id === id);
    if (!c) return;
    if (!confirm(`Delete "${c.name_en}"?`)) return;
    try {
      await api('/api/admin/menu/categories/' + id, { method:'DELETE' });
      toast(tr('saved_ok'), 'ok');
      S._categoriesCache = null;
      _switchMenuTab('categories');
    } catch (e) {
      const code = e.body?.error;
      if (code === 'category_in_use') toast(tr('cat_in_use_err'), 'err');
      else toast(e.message || tr('err_generic'), 'err');
    }
  }

  // ── Sprint 2.2: items list/editor ─────────────────────────────────────
  let _itemsFilter = { category_id: '', q: '' };

  async function renderMenuItems() {
    const body = document.getElementById('menu-tab-body');
    body.innerHTML = `<div style="opacity:.5">Loading…</div>`;
    let items, cats;
    try {
      [items, cats] = await Promise.all([
        api('/api/admin/menu/items'),
        api('/api/admin/menu/categories')
      ]);
    } catch (e) { body.innerHTML = `<div style="color:#ff7070">${escapeHtml(e.message)}</div>`; return; }
    S._itemsCache = items;
    S._categoriesCache = cats;

    // apply filter
    let visible = items;
    if (_itemsFilter.category_id) {
      visible = visible.filter(i => String(i.category_id) === String(_itemsFilter.category_id));
    }
    if (_itemsFilter.q) {
      const q = _itemsFilter.q.toLowerCase();
      visible = visible.filter(i =>
        (i.code || '').toLowerCase().includes(q) ||
        (i.name_en || '').toLowerCase().includes(q) ||
        (i.name_ar || '').toLowerCase().includes(q) ||
        (i.name_ko || '').toLowerCase().includes(q)
      );
    }
    const lng = lang();
    body.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px">
        <select id="items-cat-filter" onchange="MKS._setItemsFilter({category_id:this.value})"
          style="padding:8px 12px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:6px;color:#fff;font-size:13px">
          <option value="">${tr('item_filter_all')}</option>
          ${cats.map(c => `<option value="${c.id}" ${String(_itemsFilter.category_id)===String(c.id)?'selected':''}>${escapeHtml(lng==='ar'?c.name_ar||c.name_en:c.name_en)}</option>`).join('')}
        </select>
        <input id="items-q" type="text" placeholder="${tr('item_search')}" value="${escapeHtml(_itemsFilter.q)}"
          oninput="MKS._setItemsFilter({q:this.value})"
          style="flex:1;padding:8px 12px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:6px;color:#fff;font-size:13px">
        <button class="set-btn primary" onclick="MKS._itemEdit(null)">${tr('item_add')}</button>
      </div>
      ${visible.length === 0 ? `<div style="opacity:.5;text-align:center;padding:60px 0;font-size:13px">${tr('item_no_items')}</div>` : `
      <table class="staff-tbl">
        <thead><tr>
          <th></th>
          <th>${tr('item_code')}</th>
          <th>${tr('item_name_en')}</th>
          <th>${tr('item_category')}</th>
          <th style="text-align:end">${tr('item_base_price')}</th>
          <th>${tr('item_kind')}</th>
          <th>${tr('item_active')}</th>
          <th>${tr('item_sold_out')}</th>
          <th></th>
        </tr></thead>
        <tbody>
          ${visible.map(i => {
            const cat = cats.find(c => c.id === i.category_id);
            const catLabel = cat ? (lng==='ar' ? (cat.name_ar||cat.name_en) : cat.name_en) : '—';
            const photoCell = i.photo_url
              ? `<img src="${escapeHtml(i.photo_url)}" alt="" style="width:32px;height:32px;border-radius:6px;object-fit:cover;background:rgba(255,255,255,.05)">`
              : `<div style="width:32px;height:32px;border-radius:6px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:18px">${escapeHtml(i.emoji||'·')}</div>`;
            return `
              <tr class="${i.active?'':'inactive'}">
                <td>${photoCell}</td>
                <td><code style="font-family:ui-monospace,Menlo,monospace;font-size:11px;padding:2px 6px;background:rgba(255,255,255,.06);border-radius:4px">${escapeHtml(i.code)}</code></td>
                <td><strong>${escapeHtml(i.name_en)}</strong>${i.name_ar?`<div style="font-size:11px;opacity:.6" dir="rtl">${escapeHtml(i.name_ar)}</div>`:''}</td>
                <td><span class="role-badge" style="background:${cat?.color||'rgba(255,255,255,.1)'}33;color:${cat?.color||'#fff'}">${escapeHtml(catLabel)}</span></td>
                <td style="text-align:end;font-family:ui-monospace,Menlo,monospace">${i.base_price.toLocaleString()}</td>
                <td><span style="font-size:11px;opacity:.7">${i.kind === 'set' ? tr('item_kind_set') : tr('item_kind_single')}</span></td>
                <td>${i.active?'✓':'—'}</td>
                <td>${i.sold_out?'<span style="color:#ff7070">⊘</span>':'·'}</td>
                <td>
                  <div class="row-acts">
                    <button onclick="MKS._itemEdit(${i.id})">${tr('staff_edit')}</button>
                    <button class="danger" onclick="MKS._itemDelete(${i.id})">${tr('staff_delete')}</button>
                  </div>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    `;
  }

  function _setItemsFilter(patch) {
    _itemsFilter = { ..._itemsFilter, ...patch };
    renderMenuItems();
  }

  async function _itemEdit(id) {
    const isCreate = !id;
    const item = isCreate ? null : (S._itemsCache || []).find(x => x.id === id);
    if (!isCreate && !item) return;
    const cats = S._categoriesCache || [];
    const lng = lang();
    const body = document.getElementById('menu-tab-body');

    // Sprint 2.4: load modifier groups + currently attached ids when editing
    let allModGroups = [];
    let attachedGroupIds = [];
    if (!isCreate) {
      try {
        const [groupsResp, attachedResp] = await Promise.all([
          api('/api/admin/menu/modifier-groups'),
          api('/api/admin/menu/items/' + id + '/modifier-groups')
        ]);
        allModGroups = groupsResp || [];
        attachedGroupIds = attachedResp.group_ids || [];
      } catch (_) {}
    }
    body.innerHTML = `
      <div class="set-card" style="margin:0">
        <h3>${isCreate ? tr('item_add') : (tr('staff_edit') + ' — ' + escapeHtml(item.name_en))}</h3>
        <div class="set-row"><label>${tr('item_code')}</label>
          <div class="ctl"><input id="ie-code" type="text" value="${escapeHtml(item?.code||'')}" maxlength="32" placeholder="e.g. C001 or LATTE_NEW"></div>
        </div>
        <div class="set-row"><label>${tr('item_name_en')}</label>
          <div class="ctl"><input id="ie-name-en" type="text" value="${escapeHtml(item?.name_en||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('item_name_ar')}</label>
          <div class="ctl"><input id="ie-name-ar" type="text" dir="rtl" value="${escapeHtml(item?.name_ar||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('item_name_ko')}</label>
          <div class="ctl"><input id="ie-name-ko" type="text" value="${escapeHtml(item?.name_ko||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('item_emoji')}</label>
          <div class="ctl"><input id="ie-emoji" type="text" maxlength="4" value="${escapeHtml(item?.emoji||'')}" style="max-width:80px;text-align:center;font-size:20px"></div>
        </div>
        <div class="set-row"><label>${tr('item_category')}</label>
          <div class="ctl">
            <select id="ie-cat">
              <option value="">—</option>
              ${cats.map(c => `<option value="${c.id}" ${item?.category_id===c.id?'selected':''}>${escapeHtml(lng==='ar'?(c.name_ar||c.name_en):c.name_en)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="set-row"><label>${tr('item_base_price')}</label>
          <div class="ctl"><input id="ie-price" type="number" min="0" step="50" value="${item?.base_price ?? 0}" style="max-width:160px;font-family:ui-monospace,Menlo,monospace"></div>
        </div>
        <div class="set-row"><label>${tr('item_kind')}</label>
          <div class="ctl">
            <select id="ie-kind">
              <option value="single" ${(item?.kind||'single')==='single'?'selected':''}>${tr('item_kind_single')}</option>
              <option value="set"    ${item?.kind==='set'?'selected':''}>${tr('item_kind_set')}</option>
            </select>
          </div>
        </div>
        <div class="set-row"><label>${tr('item_sort')}</label>
          <div class="ctl"><input id="ie-sort" type="number" min="0" value="${item?.sort_order ?? 100}" style="max-width:120px"></div>
        </div>
        <div class="set-row"><label>${tr('item_desc')}</label>
          <div class="ctl"><textarea id="ie-desc" maxlength="500">${escapeHtml(item?.description||'')}</textarea></div>
        </div>
        <div class="set-row"><label>${tr('item_active')}</label>
          <div class="ctl"><label style="display:flex;gap:6px;align-items:center"><input id="ie-active" type="checkbox" ${(!item || item.active) ? 'checked' : ''}> ${tr('item_active')}</label></div>
        </div>
        ${!isCreate ? `
          <div class="set-row"><label>${tr('item_sold_out')}</label>
            <div class="ctl"><label style="display:flex;gap:6px;align-items:center"><input id="ie-soldout" type="checkbox" ${item.sold_out?'checked':''} onchange="MKS._toggleSoldOut(${item.id}, this.checked)"> ${tr('item_sold_out')}</label></div>
          </div>
          <div class="set-row"><label>${tr('item_photo')}</label>
            <div class="ctl">
              ${item.photo_url
                ? `<img src="${escapeHtml(item.photo_url)}" style="max-width:160px;max-height:160px;border-radius:8px;object-fit:cover;background:rgba(255,255,255,.05);margin-bottom:8px"><br>`
                : `<div style="opacity:.5;font-size:12px;margin-bottom:8px">${tr('item_no_photo')}</div>`}
              <input type="file" id="ie-photo" accept="image/jpeg,image/png,image/webp" style="font-size:12px">
              <button class="set-btn" onclick="MKS._uploadItemPhoto(${item.id})" style="margin-inline-start:8px">${tr('item_upload')}</button>
            </div>
          </div>
          <div class="set-row" style="align-items:flex-start"><label>${tr('item_mod_groups')}</label>
            <div class="ctl">
              ${allModGroups.length === 0
                ? `<div style="opacity:.5;font-size:12px">${tr('item_no_mod')}</div>`
                : `<div style="font-size:11px;opacity:.6;margin-bottom:8px">${tr('item_mod_help')}</div>
                   <div style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto;padding:8px;background:rgba(0,0,0,.2);border-radius:7px;border:1px solid rgba(255,255,255,.06)">
                     ${allModGroups.map(g => {
                       const checked = attachedGroupIds.includes(g.id);
                       const lbl = lng==='ar'?(g.name_ar||g.name_en):g.name_en;
                       return `<label style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:rgba(255,255,255,${checked?'0.04':'0'});border-radius:5px;cursor:pointer">
                         <input type="checkbox" class="ie-mod-grp" data-gid="${g.id}" ${checked?'checked':''}>
                         <span style="flex:1">${escapeHtml(lbl)}</span>
                         <code style="font-family:ui-monospace,Menlo,monospace;font-size:10px;padding:1px 5px;background:rgba(255,255,255,.06);border-radius:3px;opacity:.7">${escapeHtml(g.code)}</code>
                         <span style="font-size:10px;opacity:.5">${g.options.length} opts</span>
                       </label>`;
                     }).join('')}
                   </div>`}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="set-actions">
        <button class="set-btn" onclick="MKS._switchMenuTab('items')">${tr('cancel')}</button>
        <button class="set-btn primary" id="ie-save">${isCreate ? tr('staff_create') : tr('save')}</button>
      </div>
    `;
    document.getElementById('ie-save').addEventListener('click', async () => {
      const payload = {
        code:        document.getElementById('ie-code').value.trim(),
        name_en:     document.getElementById('ie-name-en').value.trim(),
        name_ar:     document.getElementById('ie-name-ar').value.trim(),
        name_ko:     document.getElementById('ie-name-ko').value.trim(),
        emoji:       document.getElementById('ie-emoji').value.trim() || null,
        category_id: document.getElementById('ie-cat').value ? parseInt(document.getElementById('ie-cat').value, 10) : null,
        base_price:  parseFloat(document.getElementById('ie-price').value) || 0,
        kind:        document.getElementById('ie-kind').value,
        sort_order:  parseInt(document.getElementById('ie-sort').value, 10) || 100,
        description: document.getElementById('ie-desc').value || null,
        active:      document.getElementById('ie-active').checked
      };
      try {
        let savedItemId;
        if (isCreate) {
          const r = await api('/api/admin/menu/items', { method:'POST', body: JSON.stringify(payload) });
          savedItemId = r.id;
        } else {
          await api('/api/admin/menu/items/' + item.id, { method:'PUT', body: JSON.stringify(payload) });
          savedItemId = item.id;
        }
        // Sprint 2.4: sync attached modifier groups (edit mode only — create
        // flow returns to list, user can attach groups in the next save)
        if (!isCreate) {
          const checked = Array.from(document.querySelectorAll('.ie-mod-grp:checked'))
            .map(el => parseInt(el.dataset.gid, 10));
          await api('/api/admin/menu/items/' + savedItemId + '/modifier-groups', {
            method: 'PUT',
            body: JSON.stringify({ group_ids: checked })
          });
        }
        toast(tr('saved_ok'), 'ok');
        S._itemsCache = null;
        _switchMenuTab('items');
      } catch (e) {
        toast(e.body?.error || e.message || tr('err_generic'), 'err');
      }
    });
  }

  async function _itemDelete(id) {
    const it = (S._itemsCache || []).find(x => x.id === id);
    if (!it) return;
    if (!confirm(`Delete "${it.name_en}"? This will also remove its photo.`)) return;
    try {
      await api('/api/admin/menu/items/' + id, { method:'DELETE' });
      toast(tr('saved_ok'), 'ok');
      S._itemsCache = null;
      _switchMenuTab('items');
    } catch (e) {
      toast(e.body?.error || e.message || tr('err_generic'), 'err');
    }
  }

  async function _toggleSoldOut(id, soldOut) {
    try {
      await api('/api/admin/menu/items/' + id + '/sold-out', {
        method:'POST', body: JSON.stringify({ sold_out: soldOut })
      });
      toast(soldOut ? '⊘ ' + tr('item_sold_out') : tr('saved_ok'), 'ok');
      S._itemsCache = null;
    } catch (e) {
      toast(e.body?.error || e.message || tr('err_generic'), 'err');
    }
  }

  // ── Sprint 2.3: modifier groups & options ─────────────────────────────
  async function renderMenuModifiers() {
    const body = document.getElementById('menu-tab-body');
    body.innerHTML = `<div style="opacity:.5">Loading…</div>`;
    let groups;
    try { groups = await api('/api/admin/menu/modifier-groups'); }
    catch (e) { body.innerHTML = `<div style="color:#ff7070">${escapeHtml(e.message)}</div>`; return; }
    S._modGroupsCache = groups;
    const lng = lang();
    body.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        <button class="set-btn primary" onclick="MKS._modGroupEdit(null)">${tr('mod_group_add')}</button>
      </div>
      ${groups.length === 0
        ? `<div style="opacity:.5;text-align:center;padding:60px 0;font-size:13px">${tr('mod_no_groups')}</div>`
        : groups.map(g => `
          <div class="set-card" style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
              <div style="flex:1">
                <h3 style="margin:0;display:flex;align-items:center;gap:8px">
                  ${escapeHtml(lng==='ar'?(g.name_ar||g.name_en):g.name_en)}
                  <code style="font-family:ui-monospace,Menlo,monospace;font-size:11px;padding:2px 6px;background:rgba(255,255,255,.06);border-radius:4px;font-weight:400">${escapeHtml(g.code)}</code>
                </h3>
                <div style="font-size:11px;opacity:.6;margin-top:4px">
                  ${g.selection === 'multi' ? tr('mod_selection_multi') : tr('mod_selection_single')}
                  ${g.required ? ' · ' + tr('mod_required') : ''}
                  · ${g.options.length} ${tr('mod_options')}
                </div>
              </div>
              <button class="set-btn" onclick="MKS._modGroupEdit(${g.id})">${tr('staff_edit')}</button>
              <button class="set-btn danger" onclick="MKS._modGroupDelete(${g.id})">${tr('staff_delete')}</button>
            </div>
            <table class="staff-tbl" style="margin-bottom:10px">
              <thead><tr>
                <th>${tr('item_code')}</th>
                <th>${tr('item_name_en')}</th>
                <th>${tr('item_name_ar')}</th>
                <th>${tr('item_name_ko')}</th>
                <th style="text-align:end">${tr('mod_opt_delta')}</th>
                <th>${tr('mod_opt_default')}</th>
                <th>${tr('item_sort')}</th>
                <th></th>
              </tr></thead>
              <tbody>
                ${g.options.map(o => `
                  <tr>
                    <td><code style="font-family:ui-monospace,Menlo,monospace;font-size:11px;padding:2px 6px;background:rgba(255,255,255,.06);border-radius:4px">${escapeHtml(o.code)}</code></td>
                    <td><strong>${escapeHtml(o.name_en)}</strong></td>
                    <td dir="rtl">${escapeHtml(o.name_ar||'')}</td>
                    <td>${escapeHtml(o.name_ko||'')}</td>
                    <td style="text-align:end;font-family:ui-monospace,Menlo,monospace">${o.price_delta_iqd ? '+' + o.price_delta_iqd.toLocaleString() : '—'}</td>
                    <td>${o.is_default?'★':''}</td>
                    <td style="opacity:.6">${o.sort_order}</td>
                    <td>
                      <div class="row-acts">
                        <button onclick="MKS._modOptEdit(${g.id}, ${o.id})">${tr('staff_edit')}</button>
                        <button class="danger" onclick="MKS._modOptDelete(${o.id})">${tr('staff_delete')}</button>
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
            <button class="set-btn" onclick="MKS._modOptEdit(${g.id}, null)" style="font-size:12px">${tr('mod_opt_add')}</button>
          </div>
        `).join('')}
    `;
  }

  function _modGroupEdit(id) {
    const isCreate = !id;
    const g = isCreate ? null : (S._modGroupsCache || []).find(x => x.id === id);
    if (!isCreate && !g) return;
    const body = document.getElementById('menu-tab-body');
    body.innerHTML = `
      <div class="set-card" style="margin:0">
        <h3>${isCreate ? tr('mod_group_add') : (tr('staff_edit') + ' — ' + escapeHtml(g.name_en))}</h3>
        <div class="set-row"><label>${tr('item_code')}</label>
          <div class="ctl"><input id="mge-code" type="text" value="${escapeHtml(g?.code||'')}" ${isCreate?'':'readonly'} maxlength="32" placeholder="e.g. milk_alt"></div>
        </div>
        <div class="set-row"><label>${tr('item_name_en')}</label>
          <div class="ctl"><input id="mge-name-en" type="text" value="${escapeHtml(g?.name_en||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('item_name_ar')}</label>
          <div class="ctl"><input id="mge-name-ar" type="text" dir="rtl" value="${escapeHtml(g?.name_ar||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('item_name_ko')}</label>
          <div class="ctl"><input id="mge-name-ko" type="text" value="${escapeHtml(g?.name_ko||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('mod_selection')}</label>
          <div class="ctl">
            <select id="mge-selection">
              <option value="single" ${(g?.selection||'single')==='single'?'selected':''}>${tr('mod_selection_single')}</option>
              <option value="multi"  ${g?.selection==='multi'?'selected':''}>${tr('mod_selection_multi')}</option>
            </select>
          </div>
        </div>
        <div class="set-row"><label>${tr('mod_required')}</label>
          <div class="ctl"><label style="display:flex;gap:6px;align-items:center"><input id="mge-required" type="checkbox" ${g?.required?'checked':''}> ${tr('mod_required')}</label></div>
        </div>
        <div class="set-row"><label>${tr('item_sort')}</label>
          <div class="ctl"><input id="mge-sort" type="number" min="0" value="${g?.sort_order ?? 100}" style="max-width:120px"></div>
        </div>
      </div>
      <div class="set-actions">
        <button class="set-btn" onclick="MKS._switchMenuTab('modifiers')">${tr('cancel')}</button>
        <button class="set-btn primary" id="mge-save">${isCreate ? tr('staff_create') : tr('save')}</button>
      </div>
    `;
    document.getElementById('mge-save').addEventListener('click', async () => {
      const payload = {
        name_en:   document.getElementById('mge-name-en').value.trim(),
        name_ar:   document.getElementById('mge-name-ar').value.trim(),
        name_ko:   document.getElementById('mge-name-ko').value.trim(),
        selection: document.getElementById('mge-selection').value,
        required:  document.getElementById('mge-required').checked,
        sort_order:parseInt(document.getElementById('mge-sort').value, 10) || 100
      };
      if (isCreate) payload.code = document.getElementById('mge-code').value.trim().toLowerCase();
      try {
        if (isCreate) await api('/api/admin/menu/modifier-groups', { method:'POST', body: JSON.stringify(payload) });
        else          await api('/api/admin/menu/modifier-groups/' + g.id, { method:'PUT', body: JSON.stringify(payload) });
        toast(tr('saved_ok'), 'ok');
        S._modGroupsCache = null;
        _switchMenuTab('modifiers');
      } catch (e) {
        toast(e.body?.error || e.message || tr('err_generic'), 'err');
      }
    });
  }

  async function _modGroupDelete(id) {
    const g = (S._modGroupsCache || []).find(x => x.id === id);
    if (!g) return;
    if (!confirm(`Delete group "${g.name_en}"? All its options will be removed.`)) return;
    try {
      await api('/api/admin/menu/modifier-groups/' + id, { method:'DELETE' });
      toast(tr('saved_ok'), 'ok');
      S._modGroupsCache = null;
      _switchMenuTab('modifiers');
    } catch (e) {
      const code = e.body?.error;
      if (code === 'group_in_use') toast(tr('mod_in_use'), 'err');
      else toast(e.message || tr('err_generic'), 'err');
    }
  }

  function _modOptEdit(groupId, optId) {
    const isCreate = !optId;
    const g = (S._modGroupsCache || []).find(x => x.id === groupId);
    if (!g) return;
    const o = isCreate ? null : g.options.find(x => x.id === optId);
    if (!isCreate && !o) return;
    const body = document.getElementById('menu-tab-body');
    body.innerHTML = `
      <div class="set-card" style="margin:0">
        <h3>${escapeHtml(g.name_en)} — ${isCreate ? tr('mod_opt_add') : (tr('staff_edit') + ' — ' + escapeHtml(o.name_en))}</h3>
        <div class="set-row"><label>${tr('item_code')}</label>
          <div class="ctl"><input id="moe-code" type="text" value="${escapeHtml(o?.code||'')}" ${isCreate?'':'readonly'} maxlength="32"></div>
        </div>
        <div class="set-row"><label>${tr('item_name_en')}</label>
          <div class="ctl"><input id="moe-name-en" type="text" value="${escapeHtml(o?.name_en||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('item_name_ar')}</label>
          <div class="ctl"><input id="moe-name-ar" type="text" dir="rtl" value="${escapeHtml(o?.name_ar||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('item_name_ko')}</label>
          <div class="ctl"><input id="moe-name-ko" type="text" value="${escapeHtml(o?.name_ko||'')}"></div>
        </div>
        <div class="set-row"><label>${tr('mod_opt_delta')}</label>
          <div class="ctl"><input id="moe-delta" type="number" step="100" value="${o?.price_delta_iqd ?? 0}" style="max-width:160px;font-family:ui-monospace,Menlo,monospace"></div>
        </div>
        <div class="set-row"><label>${tr('mod_opt_default')}</label>
          <div class="ctl"><label style="display:flex;gap:6px;align-items:center"><input id="moe-default" type="checkbox" ${o?.is_default?'checked':''}> ${tr('mod_opt_default')}</label></div>
        </div>
        <div class="set-row"><label>${tr('item_sort')}</label>
          <div class="ctl"><input id="moe-sort" type="number" min="0" value="${o?.sort_order ?? 100}" style="max-width:120px"></div>
        </div>
      </div>
      <div class="set-actions">
        <button class="set-btn" onclick="MKS._switchMenuTab('modifiers')">${tr('cancel')}</button>
        <button class="set-btn primary" id="moe-save">${isCreate ? tr('staff_create') : tr('save')}</button>
      </div>
    `;
    document.getElementById('moe-save').addEventListener('click', async () => {
      const payload = {
        name_en: document.getElementById('moe-name-en').value.trim(),
        name_ar: document.getElementById('moe-name-ar').value.trim(),
        name_ko: document.getElementById('moe-name-ko').value.trim(),
        price_delta_iqd: parseInt(document.getElementById('moe-delta').value, 10) || 0,
        is_default: document.getElementById('moe-default').checked,
        sort_order: parseInt(document.getElementById('moe-sort').value, 10) || 100
      };
      if (isCreate) payload.code = document.getElementById('moe-code').value.trim().toLowerCase();
      try {
        if (isCreate) await api('/api/admin/menu/modifier-groups/' + groupId + '/options',
                                { method:'POST', body: JSON.stringify(payload) });
        else          await api('/api/admin/menu/modifier-options/' + o.id,
                                { method:'PUT', body: JSON.stringify(payload) });
        toast(tr('saved_ok'), 'ok');
        S._modGroupsCache = null;
        _switchMenuTab('modifiers');
      } catch (e) {
        toast(e.body?.error || e.message || tr('err_generic'), 'err');
      }
    });
  }

  async function _modOptDelete(id) {
    if (!confirm('Delete this option?')) return;
    try {
      await api('/api/admin/menu/modifier-options/' + id, { method:'DELETE' });
      toast(tr('saved_ok'), 'ok');
      S._modGroupsCache = null;
      _switchMenuTab('modifiers');
    } catch (e) {
      toast(e.message || tr('err_generic'), 'err');
    }
  }

  // ── Sprint 2.5: sets (combos) ─────────────────────────────────────────
  async function renderMenuSets() {
    const body = document.getElementById('menu-tab-body');
    body.innerHTML = `<div style="opacity:.5">Loading…</div>`;
    let allItems;
    try { allItems = await api('/api/admin/menu/items'); }
    catch (e) { body.innerHTML = `<div style="color:#ff7070">${escapeHtml(e.message)}</div>`; return; }
    S._itemsCache = allItems;
    const lng = lang();

    const sets = allItems.filter(i => i.kind === 'set');
    body.innerHTML = `
      <div style="font-size:11px;opacity:.6;margin-bottom:14px">${tr('sets_intro')}</div>
      ${sets.length === 0
        ? `<div style="opacity:.5;text-align:center;padding:60px 0;font-size:13px">${tr('sets_no_sets')}</div>`
        : `<table class="staff-tbl">
          <thead><tr>
            <th></th>
            <th>${tr('item_code')}</th>
            <th>${tr('item_name_en')}</th>
            <th style="text-align:end">${tr('item_base_price')}</th>
            <th>${tr('item_active')}</th>
            <th></th>
          </tr></thead>
          <tbody>
            ${sets.map(s => {
              const photo = s.photo_url
                ? `<img src="${escapeHtml(s.photo_url)}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;background:rgba(255,255,255,.05)">`
                : `<div style="width:32px;height:32px;border-radius:6px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:18px">${escapeHtml(s.emoji||'·')}</div>`;
              return `<tr class="${s.active?'':'inactive'}">
                <td>${photo}</td>
                <td><code style="font-family:ui-monospace,Menlo,monospace;font-size:11px;padding:2px 6px;background:rgba(255,255,255,.06);border-radius:4px">${escapeHtml(s.code)}</code></td>
                <td><strong>${escapeHtml(s.name_en)}</strong>${s.name_ar?`<div style="font-size:11px;opacity:.6" dir="rtl">${escapeHtml(s.name_ar)}</div>`:''}</td>
                <td style="text-align:end;font-family:ui-monospace,Menlo,monospace">${s.base_price.toLocaleString()}</td>
                <td>${s.active?'✓':'—'}</td>
                <td><div class="row-acts">
                  <button onclick="MKS._setComponentsEdit(${s.id})">${tr('sets_components')}</button>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody></table>`}
    `;
  }

  async function _setComponentsEdit(setId) {
    const body = document.getElementById('menu-tab-body');
    body.innerHTML = `<div style="opacity:.5">Loading…</div>`;
    const set = (S._itemsCache || []).find(x => x.id === setId);
    if (!set) { _switchMenuTab('sets'); return; }
    let comps;
    try {
      const r = await api('/api/admin/menu/items/' + setId + '/set-components');
      comps = r.components || [];
    } catch (e) { body.innerHTML = `<div style="color:#ff7070">${escapeHtml(e.message)}</div>`; return; }
    // Eligible component pool: all single items (no nested sets)
    const eligible = (S._itemsCache || []).filter(i => i.kind !== 'set' && i.id !== setId);
    const lng = lang();

    // working copy held in window-scoped object for inline event handlers
    S._setEditor = { setId, components: comps.map(c => ({ item_id: c.item_id, quantity: c.quantity })) };

    function rerender() {
      const list = document.getElementById('set-comp-list');
      if (!list) return;
      list.innerHTML = S._setEditor.components.length === 0
        ? `<div style="opacity:.5;font-size:12px;padding:16px;text-align:center">${tr('sets_no_comps')}</div>`
        : S._setEditor.components.map((c, idx) => {
            const it = eligible.find(x => x.id === c.item_id);
            const name = it ? (lng==='ar'?(it.name_ar||it.name_en):it.name_en) : `#${c.item_id}`;
            return `<div style="display:flex;align-items:center;gap:10px;padding:8px;background:rgba(255,255,255,.04);border-radius:7px;margin-bottom:6px">
              <span style="font-size:18px">${escapeHtml(it?.emoji||'·')}</span>
              <div style="flex:1">
                <div style="font-weight:600">${escapeHtml(name)}</div>
                <code style="font-family:ui-monospace,Menlo,monospace;font-size:10px;opacity:.6">${escapeHtml(it?.code||'')}</code>
              </div>
              <label style="font-size:11px;opacity:.7">${tr('sets_qty')}</label>
              <input type="number" min="1" value="${c.quantity}" data-idx="${idx}" onchange="MKS._setEditorSetQty(${idx}, this.value)" style="width:60px;padding:4px 6px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:5px;color:#fff;text-align:center">
              <button class="set-btn danger" style="font-size:11px;padding:4px 10px" onclick="MKS._setEditorRemove(${idx})">×</button>
            </div>`;
          }).join('');
    }

    body.innerHTML = `
      <div class="set-card" style="margin:0">
        <h3>${escapeHtml(set.name_en)} — ${tr('sets_components')}</h3>
        <div style="font-size:11px;opacity:.6;margin-bottom:14px">${escapeHtml(set.code)} · ${set.base_price.toLocaleString()} IQD</div>
        <div id="set-comp-list" style="margin-bottom:14px"></div>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="set-comp-pick" style="flex:1;padding:8px 12px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:6px;color:#fff;font-size:13px">
            <option value="">${tr('sets_pick_item')}</option>
            ${eligible.map(i => {
              const lbl = lng==='ar'?(i.name_ar||i.name_en):i.name_en;
              return `<option value="${i.id}">${escapeHtml(lbl)} · ${i.base_price.toLocaleString()} IQD</option>`;
            }).join('')}
          </select>
          <button class="set-btn primary" onclick="MKS._setEditorAdd()">${tr('sets_add_comp')}</button>
        </div>
      </div>
      <div class="set-actions">
        <button class="set-btn" onclick="MKS._switchMenuTab('sets')">${tr('cancel')}</button>
        <button class="set-btn primary" id="sce-save">${tr('sets_save')}</button>
      </div>
    `;
    document.getElementById('sce-save').addEventListener('click', async () => {
      try {
        await api('/api/admin/menu/items/' + setId + '/set-components', {
          method: 'PUT',
          body: JSON.stringify({ components: S._setEditor.components })
        });
        toast(tr('saved_ok'), 'ok');
        _switchMenuTab('sets');
      } catch (e) {
        toast(e.body?.error || e.message || tr('err_generic'), 'err');
      }
    });
    rerender();
    // expose helpers to inline handlers
    MKS._setEditorRerender = rerender;
  }

  function _setEditorAdd() {
    const sel = document.getElementById('set-comp-pick');
    const itemId = parseInt(sel.value, 10);
    if (!itemId) return;
    if (S._setEditor.components.find(c => c.item_id === itemId)) {
      toast('Already added', 'warn'); return;
    }
    S._setEditor.components.push({ item_id: itemId, quantity: 1 });
    sel.value = '';
    if (MKS._setEditorRerender) MKS._setEditorRerender();
  }
  function _setEditorRemove(idx) {
    S._setEditor.components.splice(idx, 1);
    if (MKS._setEditorRerender) MKS._setEditorRerender();
  }
  function _setEditorSetQty(idx, val) {
    const q = Math.max(1, parseInt(val, 10) || 1);
    S._setEditor.components[idx].quantity = q;
  }

  async function _uploadItemPhoto(id) {
    const fileInput = document.getElementById('ie-photo');
    const file = fileInput?.files?.[0];
    if (!file) { toast('Choose a file first', 'warn'); return; }
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const tok = localStorage.getItem('cashierToken');
      const r = await fetch('/api/admin/menu/items/' + id + '/photo', {
        method: 'POST',
        headers: { 'x-cashier-token': tok || '' },
        body: fd
      });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        toast(j.error || 'Upload failed', 'err');
        return;
      }
      toast(tr('saved_ok'), 'ok');
      S._itemsCache = null;
      // re-render the editor with the new photo
      _itemEdit(id);
    } catch (e) {
      toast(e.message || tr('err_generic'), 'err');
    }
  }

  // =============================================================
  // SECTION: SECURITY (admin pw + audit log)
  // =============================================================
  async function renderSecurity() {
    const pane = document.getElementById('set-pane');
    pane.innerHTML = `
      <header><h2>${tr('sec_security')}</h2></header>
      <div class="set-card">
        <h3>${tr('sec_admin_pw_change')}</h3>
        <div class="set-row"><label>${tr('sec_current_pw')}</label><div class="ctl"><input id="ap-cur" type="password"></div></div>
        <div class="set-row"><label>${tr('sec_new_pw')}</label><div class="ctl"><input id="ap-new" type="password"></div></div>
        <div class="set-actions">
          <button class="set-btn primary" id="ap-save">${tr('save')}</button>
        </div>
      </div>

      <div class="set-card">
        <h3>${tr('sec_audit')}</h3>
        <div style="font-size:11px;opacity:.6;margin-bottom:12px">${tr('sec_audit_retention')}</div>
        <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
          <input id="al-action" type="text" placeholder="${tr('sec_audit_filter_action')} (e.g. staff., refund, settings)" style="flex:2;padding:8px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:6px;color:#fff;font-size:12px">
          <input id="al-actor" type="number" placeholder="actor id" style="flex:1;max-width:120px;padding:8px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);border-radius:6px;color:#fff;font-size:12px">
          <button class="set-btn" id="al-apply">${tr('sec_audit_filter_apply')}</button>
        </div>
        <div id="audit-list"><div style="opacity:.5">Loading…</div></div>
      </div>
    `;
    document.getElementById('ap-save').addEventListener('click', changeAdminPw);
    document.getElementById('al-apply').addEventListener('click', loadAuditList);
    loadAuditList();
  }

  async function changeAdminPw() {
    const cur = document.getElementById('ap-cur').value;
    const nw  = document.getElementById('ap-new').value;
    if (!cur || nw.length < 8) { toast('Min 8 chars', 'warn'); return; }
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: cur, newPassword: nw })
      });
      toast(tr('saved_ok'), 'ok');
      document.getElementById('ap-cur').value = '';
      document.getElementById('ap-new').value = '';
    } catch (e) {
      toast(e.message || tr('err_generic'), 'err');
    }
  }

  async function loadAuditList() {
    const list = document.getElementById('audit-list');
    if (!list) return;
    list.innerHTML = `<div style="opacity:.5">Loading…</div>`;
    const action = document.getElementById('al-action')?.value || '';
    const actor  = document.getElementById('al-actor')?.value || '';
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (actor)  params.set('actor_id', actor);
    params.set('limit', '300');
    try {
      const rows = await api('/api/admin/audit?' + params.toString());
      if (!rows.length) { list.innerHTML = `<div style="opacity:.5;padding:12px">No entries</div>`; return; }
      list.innerHTML = `
        <table class="audit-tbl"><thead><tr>
          <th>WHEN</th><th>ACTOR</th><th>ACTION</th><th>TARGET</th><th>APPROVER</th><th>REASON</th><th>DIFF</th>
        </tr></thead><tbody>
          ${rows.map(r => {
            const when = new Date(r.at).toLocaleString();
            const actorTxt = r.actor_name ? `${escapeHtml(r.actor_name)} <span style="opacity:.5">(${escapeHtml(r.actor_role||'')})</span>` : '—';
            const tgt = r.target_type ? `${escapeHtml(r.target_type)}:${escapeHtml(r.target_id||'')}` : '';
            const approver = r.approver_name ? `<span class="approver">${escapeHtml(r.approver_name)}</span>` : '';
            const reason = r.reason ? `<span class="reason">${escapeHtml(r.reason)}</span>` : '';
            let diff = '';
            if (r.before || r.after) {
              const b = r.before ? JSON.stringify(r.before, null, 0) : '';
              const a = r.after  ? JSON.stringify(r.after,  null, 0) : '';
              diff = (b && a) ? (b + ' → ' + a) : (a || b);
              if (diff.length > 200) diff = diff.slice(0, 200) + '…';
            }
            return `<tr>
              <td class="at">${escapeHtml(when)}</td>
              <td class="who">${actorTxt}</td>
              <td class="act">${escapeHtml(r.action)}</td>
              <td>${tgt}</td>
              <td>${approver}</td>
              <td>${reason}</td>
              <td class="diff">${escapeHtml(diff)}</td>
            </tr>`;
          }).join('')}
        </tbody></table>
      `;
    } catch (e) {
      list.innerHTML = `<div style="color:#ff7070">${escapeHtml(e.message)}</div>`;
    }
  }

  // =============================================================
  // MANAGER OVERRIDE MODAL (reusable across the app)
  // -------------------------------------------------------------
  // Usage: const ok = await MKS.requireManagerOverride('refund', 'Customer complaint');
  //        if (ok) { /* call action with body.manager_override = ok */ }
  // Returns: { name, password, reason } or null if cancelled.
  // =============================================================
  function ensureManagerModal() {
    if (document.getElementById('mgr-mod')) return;
    const div = document.createElement('div');
    div.id = 'mgr-mod';
    div.className = 'mgr-modal';
    div.innerHTML = `
      <div class="box">
        <h3 id="mgr-title">${tr('mgr_title')}</h3>
        <div class="sub" id="mgr-sub">${tr('mgr_sub')}</div>
        <div class="field">
          <label>${tr('mgr_name')}</label>
          <input id="mgr-name" type="text" autocomplete="off">
        </div>
        <div class="field">
          <label>${tr('mgr_pw')}</label>
          <input id="mgr-pw" type="password" autocomplete="off">
        </div>
        <div class="field">
          <label>${tr('mgr_reason')}</label>
          <textarea id="mgr-reason" maxlength="300"></textarea>
        </div>
        <div class="err" id="mgr-err"></div>
        <div class="actions">
          <button class="set-btn" id="mgr-cancel">${tr('cancel')}</button>
          <button class="set-btn primary" id="mgr-ok">${tr('mgr_approve')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }

  function requireManagerOverride(perm, defaultReason) {
    ensureManagerModal();
    return new Promise(resolve => {
      const mod  = document.getElementById('mgr-mod');
      const name = document.getElementById('mgr-name');
      const pw   = document.getElementById('mgr-pw');
      const rsn  = document.getElementById('mgr-reason');
      const err  = document.getElementById('mgr-err');
      name.value = ''; pw.value = ''; rsn.value = defaultReason || ''; err.textContent = '';
      mod.classList.add('show');
      setTimeout(() => name.focus(), 50);

      const cleanup = () => {
        mod.classList.remove('show');
        document.getElementById('mgr-cancel').removeEventListener('click', onCancel);
        document.getElementById('mgr-ok').removeEventListener('click', onOk);
      };
      const onCancel = () => { cleanup(); resolve(null); };
      const onOk = async () => {
        if (!name.value.trim() || !pw.value) { err.textContent = tr('mgr_invalid'); return; }
        if (!rsn.value.trim()) { err.textContent = tr('mgr_reason_required'); return; }
        // Pre-validate (no audit, just feedback). Action endpoint re-validates.
        try {
          await api('/api/manager-validate', { method:'POST', body: JSON.stringify({
            manager_name: name.value.trim(),
            manager_password: pw.value,
            required_perm: perm
          }) });
        } catch (e) {
          if (e.body?.error === 'manager_lacks_permission') err.textContent = tr('mgr_no_perm');
          else err.textContent = tr('mgr_invalid');
          return;
        }
        const result = {
          name: name.value.trim(),
          password: pw.value,
          reason: rsn.value.trim()
        };
        cleanup();
        resolve(result);
      };
      document.getElementById('mgr-cancel').addEventListener('click', onCancel);
      document.getElementById('mgr-ok').addEventListener('click', onOk);
    });
  }

  // =============================================================
  // FORCE-CHANGE-PASSWORD MODAL (must_change_pw flow)
  // =============================================================
  function ensureForcePwModal() {
    if (document.getElementById('pw-mod')) return;
    const div = document.createElement('div');
    div.id = 'pw-mod';
    div.className = 'pw-modal';
    div.innerHTML = `
      <div class="box">
        <h3>${tr('pw_title')}</h3>
        <div class="sub">${tr('pw_sub')}</div>
        <input id="pw-cur" type="password" placeholder="${tr('sec_current_pw')}">
        <input id="pw-new" type="password" placeholder="${tr('pw_new')}">
        <input id="pw-cnf" type="password" placeholder="${tr('pw_confirm')}">
        <div class="err" id="pw-err"></div>
        <button class="set-btn primary" id="pw-set" style="width:100%">${tr('pw_set')}</button>
      </div>
    `;
    document.body.appendChild(div);
    document.getElementById('pw-set').addEventListener('click', submitForcePw);
  }

  function openForceChangePw() {
    ensureForcePwModal();
    document.getElementById('pw-mod').classList.add('show');
  }

  async function submitForcePw() {
    const cur = document.getElementById('pw-cur').value;
    const nw  = document.getElementById('pw-new').value;
    const cf  = document.getElementById('pw-cnf').value;
    const err = document.getElementById('pw-err');
    err.textContent = '';
    if (nw.length < 6) { err.textContent = tr('pw_new'); return; }
    if (nw !== cf) { err.textContent = tr('pw_mismatch'); return; }
    try {
      await api('/api/cashier/change-password', {
        method:'POST',
        body: JSON.stringify({ current_password: cur, new_password: nw })
      });
      localStorage.removeItem('must_change_pw');
      document.getElementById('pw-mod').classList.remove('show');
      toast(tr('saved_ok'), 'ok');
    } catch (e) {
      err.textContent = e.message || tr('err_generic');
    }
  }

  // =============================================================
  // PUBLIC API
  // =============================================================
  return {
    init, open, showSection,
    openStaffCreate, openStaffEdit, resetStaffPw, deleteStaff,
    requireManagerOverride,
    openForceChangePw,
    // menu (Sprint 2.1)
    _switchMenuTab, _catEdit, _catDelete,
    // menu items (Sprint 2.2)
    _setItemsFilter, _itemEdit, _itemDelete, _toggleSoldOut, _uploadItemPhoto,
    // modifiers (Sprint 2.3)
    _modGroupEdit, _modGroupDelete, _modOptEdit, _modOptDelete,
    // sets (Sprint 2.5)
    _setComponentsEdit, _setEditorAdd, _setEditorRemove, _setEditorSetQty,
    _toast: toast
  };
})();
