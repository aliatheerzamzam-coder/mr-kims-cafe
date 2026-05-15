// ══════════════════════════════════════════════
// i18n — 다국어 지원
// ══════════════════════════════════════════════
const TRANSLATIONS = {
  ar: {
    brand_sub:'إدارة المخزن', badge_admin:'🔑 مدير', btn_logout:'خروج',
    nav_dashboard:'📊 لوحة التحكم', nav_ingredients:'🧪 المواد', nav_menu:'📖 القائمة', nav_recipes:'📋 الوصفات والتكلفة',
    tab_menu_title:'📖 القائمة', menu_btn_add:'+ إضافة عنصر', menu_search_ph:'بحث…', menu_show_inactive:'إظهار غير النشطة',
    menu_hint:'العناصر المضافة هنا تتم مشاركتها مع POS والموقع.',
    menu_editor_add_title:'📖 إضافة عنصر', menu_editor_edit_title:'📖 تعديل العنصر',
    menu_f_code:'الرمز *', menu_f_category:'الفئة', menu_f_name_en:'الاسم (EN) *', menu_f_name_ar:'الاسم (AR)',
    menu_f_emoji:'إيموجي', menu_f_price:'السعر (IQD) *', menu_f_kind:'النوع', menu_f_sort:'الترتيب', menu_f_desc:'الوصف',
    menu_f_active:'نشط (يظهر في POS والموقع)',
    menu_recipe_title:'🧾 الوصفة (لحساب التكلفة)', menu_recipe_add:'+ إضافة مادة', menu_recipe_cost:'التكلفة المقدرة:',
    menu_btn_deactivate:'تعطيل', menu_empty:'لا يوجد عنصر بعد. اضغط "إضافة عنصر".',
    nav_adjust:'📦 الجرد', nav_daily:'🛒 مبيعات اليوم', nav_history:'📜 السجل', nav_settings:'⚙️ الإعدادات', nav_suppliers:'🚚 الموردون',
    tab_dashboard_title:'📊 لوحة التحكم', btn_refresh:'🔄 تحديث',
    sales_chart_title:'إحصائيات المبيعات', period_day:'اليوم', period_week:'الأسبوع', period_month:'الشهر',
    chart_daily_orders:'الطلبات اليومية', chart_top5:'الأكثر مبيعاً TOP 5',
    low_stock_title:'⚠️ تحذير نقص المخزون', expiry_warn_title:'🗓️ تحذير انتهاء الصلاحية (7 أيام)', recent_history_title:'🕐 آخر العمليات',
    col_ingredient:'المادة', col_type:'النوع', col_qty:'الكمية', col_reason:'السبب', col_datetime:'التاريخ',
    tab_ing_title:'🧪 إدارة المواد', btn_add_ing:'+ إضافة مادة',
    col_name_ko:'الاسم (KO)', col_name_ar:'اسم عربي (AR)', col_unit:'الوحدة',
    col_cur_qty:'المخزون الحالي', col_min_qty:'الحد الأدنى', col_cost:'التكلفة (IQD)',
    col_status:'الحالة', col_manage:'إدارة',
    tab_recipe_title:'📋 الوصفات والتكلفة', btn_add_recipe:'+ إضافة وصفة',
    col_menu:'القائمة', cost_calc_title:'💰 حساب التكلفة',
    label_select_menu:'اختر قائمة', btn_calc:'احسب', opt_select_menu:'— اختر قائمة —',
    tab_adjust_title:'📦 الجرد', adj_card_title:'تعديل الكمية',
    label_select_ing:'اختر المادة', opt_select:'— اختر —', label_type:'النوع',
    opt_in:'📥 وارد (إضافة)', opt_out:'📤 صادر (خصم)',
    label_qty:'الكمية', label_reason:'السبب (اختياري)', ph_reason:'مثال: توريد، إتلاف...',
    btn_apply:'✅ تطبيق',
    tab_daily_title:'🛒 مبيعات اليوم', label_sale_date:'📅 تاريخ المبيعات',
    daily_hint:'أدخل الكميات المباعة وسيتم خصم المخزون تلقائياً حسب الوصفة. القيم الصفرية تُتجاهل.',
    daily_empty:'⚠️ لا توجد وصفات مسجّلة. أضف وصفات أولاً من تبويب الوصفات.',
    btn_save_sales:'✅ حفظ المبيعات وخصم المخزون',
    btn_add_sale_row:'+ إضافة منتج',
    ph_sale_menu:'اسم المنتج',
    err_no_sale_rows:'أضف عنصراً واحداً على الأقل',
    tab_history_title:'📜 السجل',
    tab_settings_title:'⚙️ الإعدادات', pw_title:'🔑 تغيير كلمة المرور',
    label_new_pw:'كلمة المرور الجديدة', ph_new_pw:'4 أحرف على الأقل',
    label_new_pw2:'تأكيد كلمة المرور', ph_new_pw2:'أعد الإدخال',
    btn_save:'حفظ', cashier_title:'👤 إدارة الكاشير', cashier_add_title:'إضافة كاشير',
    label_name:'الاسم', ph_cashier_name:'اسم الكاشير',
    label_pw:'كلمة المرور', ph_cashier_pw:'4 أحرف على الأقل', btn_add:'إضافة',
    modal_ing_title:'إضافة مادة', label_name_ko:'الاسم (كوري) *', ph_name_ko:'مثال: شراب الفانيليا',
    label_name_ar:'الاسم (عربي)', label_unit:'الوحدة *',
    label_cur_qty:'المخزون الحالي', label_min_qty:'الحد الأدنى (تحذير)',
    label_unit_cost:'التكلفة للوحدة (IQD)', btn_cancel:'إلغاء',
    modal_recipe_title:'إضافة / تعديل وصفة', label_menu_name:'اسم القائمة *',
    ph_menu_name:'مثال: لاتيه مثلج', label_ing_list:'قائمة المواد', btn_add_ing_row:'+ إضافة مادة',
    // Dynamic JS strings
    btn_edit:'تعديل', btn_delete:'حذف',
    col_action:'إجراء',
    confirm_del_hist:'هل تريد حذف هذا السجل؟\n(سيتم استعادة كمية المخزون تلقائياً)',
    modal_hist_edit_title:'تعديل سجل الجرد',
    err_hist_type:'اختر النوع',
    err_hist_qty:'أدخل كمية صحيحة',
    err_hist_save:'فشل الحفظ. حاول مرة أخرى.',
    hist_del_fail:'فشل الحذف. حاول مرة أخرى.',
    stat_total_ing:'إجمالي المواد', stat_low_ing:'مواد ناقصة ⚠️',
    low_item_cur:'الحالي', low_item_min:'الأدنى',
    badge_in:'📥 وارد', badge_out:'📤 صادر',
    err_load_data:'فشل تحميل البيانات',
    ing_empty:'لا توجد مواد. أضف مادة.',
    status_out:'نفد', status_low:'ناقص', status_ok:'طبيعي',
    err_load_retry:'فشل التحميل. أعد تحميل الصفحة.',
    modal_ing_edit_title:'تعديل مادة',
    err_ing_name:'أدخل اسم المادة',
    err_save_net:'فشل الحفظ. تحقق من الشبكة.',
    confirm_del_ing:'هل تريد حذف هذه المادة؟\n(سيتم حذف الوصفات التي تحتوي عليها أيضاً)',
    err_del:'فشل الحذف. حاول مرة أخرى.',
    recipe_empty:'لا توجد وصفات', err_load:'فشل التحميل',
    opt_select_ing_lbl:'— اختر مادة —', ph_qty:'الكمية',
    err_menu_name:'أدخل اسم القائمة',
    err_ing_required:'أضف مادة واحدة على الأقل',
    err_dup_ing:'مواد مكررة',
    err_dup_ing_hint:'سجّل كل مادة مرة واحدة واجمع الكميات.',
    confirm_del_recipe:'هل تريد حذف هذه الوصفة؟',
    cost_menu_lbl:'القائمة', cost_total_lbl:'إجمالي التكلفة',
    btn_calculating:'جارٍ الحساب...', err_calc:'فشل الحساب. حاول مرة أخرى.',
    adj_current:'الحالي',
    err_adj_input:'أدخل المادة والكمية بشكل صحيح',
    adj_success:'تم! المخزون الحالي',
    err_req_net:'فشل الطلب. تحقق من الشبكة.',
    err_load_menus:'فشل تحميل قائمة المنتجات',
    err_no_date:'اختر تاريخاً',
    err_no_sales:'⚠️ أدخل كمية مبيعات واحدة على الأقل',
    sales_success:'منتج تم تسجيله. تم خصم المخزون.',
    hist_empty:'لا توجد سجلات',
    err_pw_mismatch:'كلمتا المرور غير متطابقتين',
    err_pw_short:'أدخل 4 أحرف على الأقل',
    pw_success:'✅ تم تغيير كلمة المرور',
    pw_change_fail:'فشل التغيير. تحقق من الشبكة.',
    cashier_empty:'لا يوجد كاشير مسجّل',
    err_cashier_name:'أدخل الاسم',
    err_cashier_pw:'كلمة المرور 4 أحرف على الأقل',
    cashier_added:'✅ تمت الإضافة',
    cashier_add_fail:'فشل الإضافة',
    cashier_add_net:'فشل الإضافة. تحقق من الشبكة.',
    confirm_del_cashier:'هل تريد حذف هذا الكاشير؟',
    // تقرير الاستهلاك
    nav_report:'📈 تقرير الاستهلاك',
    report_period_lbl:'الفترة', report_week:'هذا الأسبوع', report_month:'هذا الشهر', report_3month:'آخر 3 أشهر',
    report_chart_title:'📊 أعلى 10 مواد استهلاكاً (الصادرة)',
    report_table_title:'📋 ملخص الوارد والصادر لكل مادة',
    report_col_in:'إجمالي الوارد', report_col_out:'إجمالي الصادر', report_col_net:'صافي التغيير',
    report_empty:'لا توجد سجلات في هذه الفترة.',
    report_loading:'جارٍ تحميل البيانات...',
    // متتبع الميزانية
    budget_title:'💳 ميزانية الشراء الشهرية',
    budget_btn_set:'تعيين الهدف',
    budget_modal_title:'هدف الميزانية الشهرية (IQD)',
    budget_ph:'مثال: 500000',
    budget_no_goal:'لم يتم تعيين هدف ميزانية بعد.',
    budget_spent:'الإنفاق هذا الشهر (تقديري)',
    budget_goal:'الهدف',
    budget_remaining:'المتبقي',
    btn_cancel:'إلغاء',
    // الموردون
    supplier_title:'🚚 جهات اتصال الموردين',
    supplier_add_title:'إضافة مورد جديد',
    label_sup_name:'اسم المورد', ph_sup_name:'مثال: شركة المواد الغذائية',
    label_sup_phone:'رقم الهاتف', ph_sup_phone:'مثال: 07701234567',
    label_sup_item:'المواد المورَّدة', ph_sup_item:'مثال: منتجات الألبان، القهوة',
    label_sup_note:'ملاحظة', ph_sup_note:'اختياري',
    supplier_empty:'لا يوجد موردون مسجّلون.',
    err_sup_name:'أدخل اسم المورد',
    confirm_del_supplier:'هل تريد حذف هذا المورد؟',
    // ملخص تكلفة الكل
    all_cost_title:'📊 ملخص تكلفة جميع القوائم',
    all_cost_loading:'جارٍ حساب التكاليف...',
    all_cost_empty:'لا توجد وصفات.',
    all_cost_ing_count:'مادة',
    // تصدير CSV
    btn_export_csv:'📥 تصدير Excel',
    export_empty:'لا توجد سجلات للتصدير.',
    // أخطاء الشبكة / 401
    err_network:'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
    err_session:'انتهت الجلسة. يرجى تسجيل الدخول مجدداً.',
    // التحقق من الصحة
    err_qty_range:'يجب أن تكون الكمية بين 1 و 9999.',
    // إدارة الفئات
    cat_mgr_title:'📂 إدارة الفئات',
    cat_toggle_expand:'▼ توسيع', cat_toggle_collapse:'▲ طي',
    label_cat_name_ko:'اسم الفئة (كوري) *', label_emoji:'رمز', label_cat_name_ar:'الاسم (عربي)',
    cat_empty:'لا توجد فئات',
    // حقول مودال المواد الإضافية
    label_ing_type:'النوع (اختياري)',
    label_capacity:'السعة mL·g (0 = غير محدد)',
    label_expiry:'تاريخ الانتهاء', label_supplier_lbl:'المورد',
    ph_supplier:'اختر أو اكتب اسم المورد',
    label_origin:'بلد المنشأ', ph_origin:'مثال: تركيا، كوريا، الإمارات',
    label_market_name:'الاسم في السوق', ph_market_name:'علامة محلية أو ملصق',
    label_qty_per_box:'الكمية في الصندوق', label_num_boxes:'عدد الصناديق',
    label_market_price:'سعر السوق (د.ع)', label_market_price_short:'سوق',
    label_received_date:'تاريخ الاستلام',
    label_image:'صورة المنتج (jpg / png / webp ≤ 5MB)',
    label_contact_person:'الشخص المسؤول', ph_contact_person:'مثال: أحمد علي',
    label_whatsapp:'واتساب', ph_whatsapp:'مثال: +9647701234567',
    label_address:'العنوان', ph_address:'الشارع، الحي، المدينة',
    opt_no_supplier:'— غير محدد —',
    btn_remove_image:'إزالة الصورة',
    hint_qty_auto:'محسوبة تلقائياً من الصناديق',
    err_image_size:'يجب أن تكون الصورة 5 ميغابايت كحد أقصى',
    err_image_type:'فقط jpg / png / webp مسموحة',
    err_network:'خطأ في الشبكة',
    ph_cat_name_ko:'مثال: سيروب', ph_cat_emoji:'🍯',
    price_editor_title:'💵 إدارة أسعار البيع',
    // مودال الوصفة
    label_recipe_cat:'نوع المنتج', ph_recipe_cat:'مثال: مشروب',
    // خيارات الوحدة
    unit_bottle:'زجاجة (سيروب)', unit_kg:'كيلو (بودرة)', unit_bag:'كيس (بودرة)',
    unit_piece:'قطعة',
    // جدول
    col_emoji:'رمز', col_name_lang:'كوري',
    // رسائل JS لإدارة الفئات
    ing_empty_cat:'لا توجد مواد',
    cat_err_name:'أدخل اسم الفئة',
    cat_err_dup:'هذه الفئة موجودة بالفعل',
    cat_added:'تمت إضافة "${name}"',
    cat_btn_save_edit:'حفظ التعديل',
    cat_editing:'جارٍ تعديل "${name}"...',
    cat_saved:'تم الحفظ',
    cat_btn_add:'إضافة',
    cat_confirm_del:'هل تريد حذف فئة "${name}"؟\nسيتم نقل مواد هذه الفئة إلى أسفل القائمة.',
    // إحصائيات الرسم البياني
    stat_today_orders:'طلبات اليوم', stat_week_orders:'طلبات الأسبوع', stat_month_orders:'طلبات الشهر',
    stat_today_revenue:'إيرادات اليوم', stat_today_order_count:'طلبات اليوم',
    // لوحة التحكم
    order_needed:'مطلوب طلب', expired_badge:'منتهي',
    // بحث الوصفة
    ing_no_result:'لا توجد نتائج',
    // ملخص التكلفة
    cost_rate:'نسبة التكلفة', price_not_set:'السعر غير محدد', selling_price_lbl:'سعر البيع',
    // رؤوس CSV
    csv_col_name:'اسم المادة', csv_col_type:'النوع', csv_col_qty:'الكمية', csv_col_reason:'السبب', csv_col_dt:'التاريخ',
    csv_type_in:'وارد', csv_type_out:'صادر', csv_filename:'سجل_الجرد',
    // فئة الوصفة
    recipe_cat_count:'',
    // وصفات الحجم
    size_recipe_title:'☕ وصفات المشروبات (S/M/L)',
    btn_add_size_recipe:'+ إضافة وصفة بالحجم',
    size_recipe_hint:'اختر الوصفة المسجّلة وستظهر المواد تلقائياً. أدخل كميات S/M/L لكل مادة.',
    size_recipe_empty:'لا توجد وصفات بالحجم مسجّلة.',
    col_ingredient_sml:'المواد (S/M/L)',
    modal_size_recipe_title:'إضافة / تعديل وصفة الحجم',
    label_size_recipe_select:'اختر الوصفة *',
    err_size_menu:'اختر وصفة',
    err_size_ing:'لا توجد مواد. أضف الوصفة أولاً',
    err_size_qty:'يجب أن تكون الكميات 0 أو أكثر',
    confirm_del_size_recipe:'هل تريد حذف هذه الوصفة؟',
    // مبيعات الحجم
    size_sales_title:'☕ مبيعات المشروبات (S/M/L)',
    size_sales_hint:'أدخل الكميات لكل حجم وسيتم خصم المخزون تلقائياً.',
    size_sales_empty:'لا توجد وصفات بالحجم. أضف وصفات من تبويب الوصفات أولاً.',
    btn_save_size_sales:'✅ حفظ مبيعات الحجم وخصم المخزون',
    size_sales_success:'منتج تم تسجيله.',
    err_no_size_sales:'أدخل كمية واحدة على الأقل',
    daily_other_title:'🛒 مبيعات أخرى',
    col_location:'المواقع',
    modal_loc_title:'مواقع التخزين',
    label_shelf:'الرف', label_column:'العمود', label_row_box:'الصف',
    label_loc_preview:'الكود', label_loc_qty:'الكمية',
    btn_loc:'+ موقع', btn_add_loc:'إضافة', btn_loc_save:'حفظ',
    loc_empty:'لا توجد مواقع', loc_empty_hint:'انقر على زر الموقع لإضافته',
    loc_current_title:'المواقع الحالية',
    err_loc_format:'كود غير صالح (مثال: 2A2)',
    err_loc_qty:'الكمية يجب أن تكون 0 أو أكثر',
    confirm_del_loc:'حذف هذا الموقع؟',
    // ── Menu Category Management (server-backed) ──
    menucat_mgr_title:'📂 إدارة فئات القائمة',
    menucat_label_code:'الرمز *',
    menucat_label_name_en:'الاسم (EN) *',
    menucat_label_name_ar:'الاسم (AR) *',
    menucat_label_icon:'أيقونة',
    menucat_label_sort:'الترتيب',
    menucat_label_active:'نشط',
    menucat_err_code:'الرمز: حروف صغيرة/أرقام/_- فقط (2–32)',
    menucat_err_name_en:'أدخل الاسم بالإنجليزية',
    menucat_err_name_ar:'أدخل الاسم بالعربية',
    menucat_err_dup:'هذا الرمز موجود مسبقاً',
    menucat_err_save:'فشل الحفظ',
    menucat_err_delete:'فشل الحذف',
    menucat_err_move:'فشل نقل العناصر',
    menucat_added:'تمت إضافة الفئة',
    menucat_deleted:'تم حذف الفئة',
    menucat_confirm_del:'حذف الفئة "${name}"؟',
    menucat_move_title:'نقل العناصر قبل الحذف',
    menucat_move_msg:'الفئة "${name}" تحتوي على ${count} عنصر. اختر فئة جديدة لنقلها إليها ثم احذف.',
    menucat_move_target:'انقل إلى فئة',
    menucat_move_none:'— بدون فئة —',
    menucat_btn_move_delete:'نقل وحذف',
    menucat_err_reorder:'فشل في تغيير الترتيب',
    // ── Recipe modal — menu picker ──
    menu_no_result:'لا توجد قائمة مطابقة',
    ph_menu_name_search:'ابحث في القوائم المسجلة…',
    hint_menu_pick:'اختر من القوائم المسجلة لضمان دقة حساب التكلفة والهامش.',
    err_menu_pick:'اختر عنصراً من القائمة المنسدلة',
    // ── Menu Options (modifier groups + options) ──
    options_hint_v2:'اسحب المجموعات والخيارات لإعادة الترتيب. يراها العملاء بنفس هذا الترتيب.',
    modgrp_btn_add:'+ إضافة مجموعة',
    modgrp_title_add:'إضافة مجموعة خيارات',
    modgrp_title_edit:'تعديل المجموعة',
    modgrp_selection:'النوع',
    modgrp_single:'اختيار واحد',
    modgrp_multi:'اختيار متعدد',
    modgrp_required:'إلزامي',
    modgrp_empty:'لا توجد مجموعات بعد. اضغط "إضافة مجموعة".',
    modgrp_err_load:'فشل التحميل',
    modgrp_err_save:'فشل الحفظ',
    modgrp_err_delete:'فشل الحذف',
    modgrp_err_code:'الرمز: حروف صغيرة/أرقام/_ فقط (2–32 حرفاً)',
    modgrp_err_reorder:'فشل في تغيير ترتيب المجموعات',
    modgrp_err_in_use:'هذه المجموعة مستخدمة في ${count} عنصر. أزلها من العناصر أولاً.',
    modgrp_confirm_del:'حذف المجموعة "${name}"؟',
    modopt_count_label:'خيار',
    modopt_btn_add:'إضافة خيار',
    modopt_title_add:'إضافة خيار',
    modopt_title_edit:'تعديل الخيار',
    modopt_price_delta:'فرق السعر (IQD)',
    modopt_is_default:'افتراضي (محدد مسبقاً)',
    modopt_empty:'لا توجد خيارات. أضف واحداً.',
    modopt_err_code:'الرمز: حروف صغيرة/أرقام/_ فقط',
    modopt_err_save:'فشل الحفظ',
    modopt_err_delete:'فشل الحذف',
    modopt_err_reorder:'فشل في تغيير ترتيب الخيارات',
    modopt_confirm_del:'حذف الخيار "${name}"؟',
    loading:'جارٍ التحميل…',
  },
  en: {
    brand_sub:'Warehouse', badge_admin:'🔑 Admin', btn_logout:'Logout',
    nav_dashboard:'📊 Dashboard', nav_ingredients:'🧪 Ingredients', nav_menu:'📖 Menu', nav_recipes:'📋 Recipes & Cost',
    tab_menu_title:'📖 Menu', menu_btn_add:'+ Add Menu Item', menu_search_ph:'Search…', menu_show_inactive:'Show inactive',
    menu_hint:'Items added or edited here are shared with the POS and the public website.',
    menu_editor_add_title:'📖 Add Menu Item', menu_editor_edit_title:'📖 Edit Menu Item',
    menu_f_code:'Code *', menu_f_category:'Category', menu_f_name_en:'Name (EN) *', menu_f_name_ar:'Name (AR)',
    menu_f_emoji:'Emoji', menu_f_price:'Base Price (IQD) *', menu_f_kind:'Kind', menu_f_sort:'Sort Order', menu_f_desc:'Description',
    menu_f_active:'Active (visible on POS & website)',
    menu_recipe_title:'🧾 Recipe (used to compute cost)', menu_recipe_add:'+ Add Ingredient', menu_recipe_cost:'Estimated unit cost:',
    menu_btn_deactivate:'Deactivate', menu_empty:'No menu items yet. Click "Add Menu Item".',
    nav_adjust:'📦 Stock In/Out', nav_daily:'🛒 Daily Sales', nav_history:'📜 History', nav_settings:'⚙️ Settings', nav_suppliers:'🚚 Suppliers',
    tab_dashboard_title:'📊 Dashboard', btn_refresh:'🔄 Refresh',
    sales_chart_title:'Sales Overview', period_day:'Today', period_week:'Weekly', period_month:'Monthly',
    chart_daily_orders:'Daily Orders', chart_top5:'Best Seller TOP 5',
    low_stock_title:'⚠️ Low Stock Warning', expiry_warn_title:'🗓️ Expiry Warning (D-7)', recent_history_title:'🕐 Recent Activity',
    col_ingredient:'Ingredient', col_type:'Type', col_qty:'Qty', col_reason:'Reason', col_datetime:'Date/Time',
    tab_ing_title:'🧪 Ingredients', btn_add_ing:'+ Add Ingredient',
    col_name_ko:'Name (KO)', col_name_ar:'Arabic (AR)', col_unit:'Unit',
    col_cur_qty:'Current Stock', col_min_qty:'Min Stock', col_cost:'Unit Cost (IQD)',
    col_status:'Status', col_manage:'Manage',
    tab_recipe_title:'📋 Recipes & Cost', btn_add_recipe:'+ Add Recipe',
    col_menu:'Menu', cost_calc_title:'💰 Cost Calculator',
    label_select_menu:'Select Menu', btn_calc:'Calculate', opt_select_menu:'— Select Menu —',
    tab_adjust_title:'📦 Stock In/Out', adj_card_title:'Adjust Stock',
    label_select_ing:'Select Ingredient', opt_select:'— Select —', label_type:'Type',
    opt_in:'📥 Stock In (Add)', opt_out:'📤 Stock Out (Deduct)',
    label_qty:'Quantity', label_reason:'Reason (optional)', ph_reason:'e.g. Delivery, Disposal',
    btn_apply:'✅ Apply',
    tab_daily_title:'🛒 Daily Sales', label_sale_date:'📅 Sale Date',
    daily_hint:'Enter quantities sold; stock is deducted automatically. Zeros are ignored.',
    daily_empty:'⚠️ No recipes registered. Add menus in the Recipes tab first.',
    btn_save_sales:'✅ Save Sales & Deduct Stock',
    btn_add_sale_row:'+ Add Menu',
    ph_sale_menu:'Menu name',
    err_no_sale_rows:'Please enter at least one sale item',
    tab_history_title:'📜 Stock History',
    tab_settings_title:'⚙️ Settings', pw_title:'🔑 Change Password',
    label_new_pw:'New Password', ph_new_pw:'4+ characters',
    label_new_pw2:'Confirm Password', ph_new_pw2:'Re-enter password',
    btn_save:'Save', cashier_title:'👤 Cashier Management', cashier_add_title:'Add New Cashier',
    label_name:'Name', ph_cashier_name:'Cashier name',
    label_pw:'Password', ph_cashier_pw:'4+ characters', btn_add:'Add',
    modal_ing_title:'Add Ingredient', label_name_ko:'Name (KO) *', ph_name_ko:'e.g. Vanilla Syrup',
    label_name_ar:'Name (AR)', label_unit:'Unit *',
    label_cur_qty:'Current Stock', label_min_qty:'Min Stock (warning)',
    label_unit_cost:'Unit Cost (IQD)', btn_cancel:'Cancel',
    modal_recipe_title:'Add / Edit Recipe', label_menu_name:'Menu Name *',
    ph_menu_name:'e.g. Iced Latte', label_ing_list:'Ingredients', btn_add_ing_row:'+ Add Ingredient',
    btn_edit:'Edit', btn_delete:'Delete',
    col_action:'Action',
    confirm_del_hist:'Delete this stock record?\n(Stock will be reversed automatically)',
    modal_hist_edit_title:'Edit Stock Record',
    err_hist_type:'Select a type',
    err_hist_qty:'Enter a valid quantity',
    err_hist_save:'Save failed. Please try again.',
    hist_del_fail:'Delete failed. Please try again.',
    stat_total_ing:'Total Ingredients', stat_low_ing:'Low Stock ⚠️',
    low_item_cur:'Current', low_item_min:'Minimum',
    badge_in:'📥 In', badge_out:'📤 Out',
    err_load_data:'Failed to load data',
    ing_empty:'No ingredients. Please add one.',
    status_out:'Out of Stock', status_low:'Low', status_ok:'Normal',
    err_load_retry:'Load failed. Please refresh.',
    modal_ing_edit_title:'Edit Ingredient',
    err_ing_name:'Enter ingredient name',
    err_save_net:'Save failed. Check network.',
    confirm_del_ing:'Delete this ingredient?\n(Recipes containing it will also be deleted)',
    err_del:'Delete failed. Please try again.',
    recipe_empty:'No recipes', err_load:'Load failed',
    opt_select_ing_lbl:'— Select Ingredient —', ph_qty:'Quantity',
    err_menu_name:'Enter menu name',
    err_ing_required:'Add at least one ingredient',
    err_dup_ing:'Duplicate ingredients',
    err_dup_ing_hint:'Register each ingredient once and combine quantities.',
    confirm_del_recipe:'Delete this recipe?',
    cost_menu_lbl:'Menu', cost_total_lbl:'Total Cost',
    btn_calculating:'Calculating...', err_calc:'Calculation failed. Try again.',
    adj_current:'Current',
    err_adj_input:'Enter ingredient and quantity correctly',
    adj_success:'Done! Current stock:',
    err_req_net:'Request failed. Check network.',
    err_load_menus:'Failed to load menu list',
    err_no_date:'Select a date',
    err_no_sales:'⚠️ Enter at least one sale quantity',
    sales_success:'menus recorded. Stock deducted.',
    hist_empty:'No records',
    err_pw_mismatch:'Passwords do not match',
    err_pw_short:'Enter 4+ characters',
    pw_success:'✅ Password changed',
    pw_change_fail:'Change failed. Check network.',
    cashier_empty:'No cashiers registered',
    err_cashier_name:'Enter name',
    err_cashier_pw:'Password must be 4+ characters',
    cashier_added:'✅ Added',
    cashier_add_fail:'Add failed',
    cashier_add_net:'Add failed. Check network.',
    confirm_del_cashier:'Delete this cashier?',
    nav_report:'📈 Consumption Report',
    report_period_lbl:'Period', report_week:'This Week', report_month:'This Month', report_3month:'Last 3 Months',
    report_chart_title:'📊 Top 10 Ingredient Consumption (Outgoing)',
    report_table_title:'📋 In/Out Summary per Ingredient',
    report_col_in:'Total In', report_col_out:'Total Out', report_col_net:'Net Change',
    report_empty:'No records in this period.',
    report_loading:'Loading data...',
    budget_title:'💳 Monthly Purchase Budget',
    budget_btn_set:'Set Goal',
    budget_modal_title:'Monthly Budget Goal (IQD)',
    budget_ph:'e.g. 500000',
    budget_no_goal:'No budget goal has been set yet.',
    budget_spent:'This month\'s spending (estimated)',
    budget_goal:'Goal',
    budget_remaining:'Remaining',
    btn_cancel:'Cancel',
    supplier_title:'🚚 Supplier Contacts',
    supplier_add_title:'Add New Supplier',
    label_sup_name:'Company Name', ph_sup_name:'e.g. Baghdad Foods',
    label_sup_phone:'Phone', ph_sup_phone:'e.g. 07701234567',
    label_sup_item:'Items Supplied', ph_sup_item:'e.g. Dairy, Coffee',
    label_sup_note:'Note', ph_sup_note:'Optional',
    supplier_empty:'No suppliers registered.',
    err_sup_name:'Enter supplier name',
    confirm_del_supplier:'Delete this supplier?',
    all_cost_title:'📊 All Menu Cost Summary',
    all_cost_loading:'Calculating costs...',
    all_cost_empty:'No recipes.',
    all_cost_ing_count:'ingredients',
    btn_export_csv:'📥 Export Excel',
    export_empty:'No records to export.',
    err_network:'Check your internet connection and try again.',
    err_session:'Session expired. Please log in again.',
    err_qty_range:'Quantity must be between 1 and 9999.',
    cat_mgr_title:'📂 Category Management',
    cat_toggle_expand:'▼ Expand', cat_toggle_collapse:'▲ Collapse',
    label_cat_name_ko:'Category Name (KO) *', label_emoji:'Emoji', label_cat_name_ar:'Arabic Name',
    cat_empty:'No categories',
    label_ing_type:'Type (auto if empty)',
    label_capacity:'Capacity mL·g (0 = not set)',
    label_expiry:'Expiry Date', label_supplier_lbl:'Supplier',
    ph_supplier:'Select or enter supplier name',
    label_origin:'Origin', ph_origin:'e.g. Turkey, Korea, UAE',
    label_market_name:'Market Name', ph_market_name:'Local brand or label',
    label_qty_per_box:'Qty per Box', label_num_boxes:'Number of Boxes',
    label_market_price:'Market Price (IQD)', label_market_price_short:'MP',
    label_received_date:'Received Date',
    label_image:'Product Image (jpg/png/webp ≤ 5MB)',
    label_contact_person:'Contact Person', ph_contact_person:'e.g. Ahmed Ali',
    label_whatsapp:'WhatsApp', ph_whatsapp:'e.g. +9647701234567',
    label_address:'Address', ph_address:'Street, district, city',
    opt_no_supplier:'— Not selected —',
    btn_remove_image:'Remove image',
    hint_qty_auto:'Auto-calculated from boxes',
    err_image_size:'Image must be ≤ 5MB',
    err_image_type:'Only jpg / png / webp allowed',
    err_network:'Network error',
    ph_cat_name_ko:'e.g. Syrup', ph_cat_emoji:'🍯',
    label_recipe_cat:'Menu Type', ph_recipe_cat:'e.g. Drink',
    unit_bottle:'Bottle (Syrup)', unit_kg:'kg (Powder)', unit_bag:'Bag (Powder)',
    unit_piece:'Piece',
    col_emoji:'Emoji', col_name_lang:'Korean',
    price_editor_title:'💵 Menu Price Management',
    ing_empty_cat:'No ingredients',
    cat_err_name:'Enter category name',
    cat_err_dup:'Category already exists',
    cat_added:'"${name}" added',
    cat_btn_save_edit:'Save Edit',
    cat_editing:'Editing "${name}"...',
    cat_saved:'Saved',
    cat_btn_add:'Add',
    cat_confirm_del:'Delete category "${name}"?\nIngredients will be moved to the bottom.',
    stat_today_orders:'Today\'s Orders', stat_week_orders:'Weekly Orders', stat_month_orders:'Monthly Orders',
    stat_today_revenue:'Today\'s Revenue', stat_today_order_count:'Today\'s Orders',
    order_needed:'Order Needed', expired_badge:'Expired',
    ing_no_result:'No results',
    cost_rate:'Cost Rate', price_not_set:'Price not set', selling_price_lbl:'Selling Price',
    csv_col_name:'Ingredient', csv_col_type:'Type', csv_col_qty:'Qty', csv_col_reason:'Reason', csv_col_dt:'Date/Time',
    csv_type_in:'In', csv_type_out:'Out', csv_filename:'stock_history',
    recipe_cat_count:'',
    size_recipe_title:'☕ Size Drink Recipes',
    btn_add_size_recipe:'+ Add Size Recipe',
    size_recipe_hint:'Select a recipe and ingredients will appear. Enter S/M/L amounts for each.',
    size_recipe_empty:'No size recipes registered.',
    col_ingredient_sml:'Ingredients (S/M/L)',
    modal_size_recipe_title:'Add / Edit Size Recipe',
    label_size_recipe_select:'Select Recipe *',
    err_size_menu:'Select a recipe',
    err_size_ing:'No ingredients. Register a recipe first',
    err_size_qty:'Quantities must be 0 or more',
    confirm_del_size_recipe:'Delete this size recipe?',
    size_sales_title:'☕ Size Drink Sales',
    size_sales_hint:'Enter S/M/L quantities; stock will be deducted automatically.',
    size_sales_empty:'No size recipes. Add recipes from the Recipes tab first.',
    btn_save_size_sales:'✅ Save Size Sales & Deduct Stock',
    size_sales_success:'menus recorded.',
    err_no_size_sales:'Enter at least one quantity',
    daily_other_title:'🛒 Other Menu Sales',
    col_location:'Locations',
    modal_loc_title:'Storage Locations',
    label_shelf:'Shelf', label_column:'Column', label_row_box:'Row',
    label_loc_preview:'Code', label_loc_qty:'Quantity',
    btn_loc:'+ Loc', btn_add_loc:'Add', btn_loc_save:'Save',
    loc_empty:'No locations', loc_empty_hint:'Click the location button to add',
    loc_current_title:'Current Locations',
    err_loc_format:'Invalid code (e.g. 2A2)',
    err_loc_qty:'Quantity must be 0 or more',
    confirm_del_loc:'Delete this location?',
    // ── Menu Category Management (server-backed) ──
    menucat_mgr_title:'📂 Menu Category Management',
    menucat_label_code:'Code *',
    menucat_label_name_en:'Name (EN) *',
    menucat_label_name_ar:'Name (AR) *',
    menucat_label_icon:'Icon',
    menucat_label_sort:'Sort',
    menucat_label_active:'Active',
    menucat_err_code:'Code: lowercase letters/digits/_- only (2–32 chars)',
    menucat_err_name_en:'Enter English name',
    menucat_err_name_ar:'Enter Arabic name',
    menucat_err_dup:'This code already exists',
    menucat_err_save:'Save failed',
    menucat_err_delete:'Delete failed',
    menucat_err_move:'Move failed',
    menucat_added:'Category added',
    menucat_deleted:'Category deleted',
    menucat_confirm_del:'Delete category "${name}"?',
    menucat_move_title:'Move Items Before Delete',
    menucat_move_msg:'"${name}" has ${count} item(s). Choose a target category to move them, then delete.',
    menucat_move_target:'Move to category',
    menucat_move_none:'— Uncategorized —',
    menucat_btn_move_delete:'Move & Delete',
    menucat_err_reorder:'Reorder failed',
    // ── Recipe modal — menu picker ──
    menu_no_result:'No matching menu',
    ph_menu_name_search:'Search registered menu…',
    hint_menu_pick:'Choose from registered menu items so cost & margin stay aligned.',
    err_menu_pick:'Pick a menu item from the dropdown',
    // ── Menu Options (modifier groups + options) ──
    options_hint_v2:'Drag groups and options to reorder. Customers see them in this exact order.',
    modgrp_btn_add:'+ Add Group',
    modgrp_title_add:'Add Option Group',
    modgrp_title_edit:'Edit Group',
    modgrp_selection:'Selection',
    modgrp_single:'Single',
    modgrp_multi:'Multi',
    modgrp_required:'Required',
    modgrp_empty:'No option groups yet. Click "Add Group".',
    modgrp_err_load:'Failed to load',
    modgrp_err_save:'Save failed',
    modgrp_err_delete:'Delete failed',
    modgrp_err_code:'Code: lowercase letters/digits/_ only (2–32 chars)',
    modgrp_err_reorder:'Failed to reorder groups',
    modgrp_err_in_use:'This group is used by ${count} item(s). Remove it from those items first.',
    modgrp_confirm_del:'Delete group "${name}"?',
    modopt_count_label:'option(s)',
    modopt_btn_add:'Add Option',
    modopt_title_add:'Add Option',
    modopt_title_edit:'Edit Option',
    modopt_price_delta:'Price delta (IQD)',
    modopt_is_default:'Default (pre-selected)',
    modopt_empty:'No options yet. Add one.',
    modopt_err_code:'Code: lowercase letters/digits/_ only',
    modopt_err_save:'Save failed',
    modopt_err_delete:'Delete failed',
    modopt_err_reorder:'Failed to reorder options',
    modopt_confirm_del:'Delete option "${name}"?',
    loading:'Loading…',
  }
};

let currentLang = localStorage.getItem('wh_lang') || 'ar';
if (currentLang !== 'ar' && currentLang !== 'en') currentLang = 'ar';
const t = key => TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS.en[key] ?? key;

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('wh_lang', lang);
  const t = TRANSLATIONS[lang];
  const html = document.documentElement;
  html.setAttribute('lang', lang === 'ar' ? 'ar' : 'en');
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  // text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });
  // placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (t[key] !== undefined) el.placeholder = t[key];
  });
  // select option text (data-i18n-opt)
  document.querySelectorAll('[data-i18n-opt]').forEach(el => {
    const key = el.getAttribute('data-i18n-opt');
    if (t[key] !== undefined) el.textContent = t[key];
  });
  // unit select options
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (el.tagName === 'OPTION') {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    }
  });
  // adjType select options
  const adjType = document.getElementById('adjType');
  if (adjType) {
    adjType.options[0].text = t['opt_in'];
    adjType.options[1].text = t['opt_out'];
  }
  const histEditType = document.getElementById('histEditType');
  if (histEditType) {
    histEditType.options[0].text = t['opt_in'];
    histEditType.options[1].text = t['opt_out'];
  }

  // toggle button label
  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = lang === 'ar' ? 'EN' : 'AR';

  // 현재 활성 탭 동적 콘텐츠 새로고침 (로그인 후에만)
  if (sessionStorage.getItem('wh_token')) {
    const activePanel = document.querySelector('.tab-panel.active');
    if (activePanel) {
      const id = activePanel.id.replace('tab-', '');
      if (id === 'dashboard')   loadDashboard();
      else if (id === 'ingredients') loadIngredients();
      else if (id === 'menu')        loadMenuTab();
      else if (id === 'options')     loadOptionsTab();
      else if (id === 'recipes')     { loadRecipes(); loadSizeRecipes(); }
      else if (id === 'adjust')      loadAdjust();
      else if (id === 'daily')       loadDaily();
      else if (id === 'history')     loadHistory();
      else if (id === 'report')      loadReport();
      else if (id === 'settings')  { loadCashiers(); loadSuppliers(); }
    }
  }
}

function toggleLang() {
  applyLang(currentLang === 'ar' ? 'en' : 'ar');
}

let token = sessionStorage.getItem('wh_token') || '';
let ingredients = [];
let recipes = [];
let sizeRecipes = [];
let _histCache = [];

// ══════════════════════════════════════════════
// 1. XSS 방지 유틸리티
// ══════════════════════════════════════════════
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ══════════════════════════════════════════════
// 2. 바그다드 타임존(UTC+3) 안전 날짜 유틸리티
// ══════════════════════════════════════════════
function localDateStr() {
  // 서버와 동일한 바그다드 UTC+3 고정 오프셋. 사용자 브라우저 타임존에 의존하면 안 됨.
  const baghdad = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return baghdad.toISOString().slice(0, 10);
}

// ══════════════════════════════════════════════
// 3. Race Condition 방지: 버튼 잠금/해제
// ══════════════════════════════════════════════
function lockBtn(id, text = '...') {
  const el = document.getElementById(id);
  if (!el) return;
  el.disabled = true;
  el._origText = el.textContent;
  el.textContent = text;
}
function unlockBtn(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.disabled = false;
  if (el._origText) el.textContent = el._origText;
}

// ══════════════════════════════════════════════
// 인증
// ══════════════════════════════════════════════
async function doLogin() {
  lockBtn('loginBtn', '...');
  document.getElementById('loginErr').textContent = '';
  try {
    const pw = document.getElementById('loginPw').value;
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    const d = await r.json();
    if (d.success && d.token) {
      token = d.token;
      sessionStorage.setItem('wh_token', token);
      document.getElementById('loginOverlay').style.display = 'none';
      init();
    } else {
      document.getElementById('loginErr').textContent = d.error || 'فشل تسجيل الدخول';
    }
  } catch (e) {
    document.getElementById('loginErr').textContent = 'تعذّر الاتصال بالخادم';
  } finally {
    unlockBtn('loginBtn');
  }
}

async function doLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'x-auth-token': token } });
  } catch (e) { console.warn('[wh-logout] server call failed, clearing locally', e); }
  sessionStorage.removeItem('wh_token');
  location.reload();
}

function hdr() { return { 'Content-Type': 'application/json', 'x-auth-token': token }; }

// 공통 API fetch — 401 자동 로그아웃, 네트워크 오류 throw
async function apiFetch(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (_) {
    throw new Error('network');
  }
  if (res.status === 401) {
    await doLogout();
    throw new Error('unauthorized');
  }
  return res;
}

// ── Enter 키 전역 처리 ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginPw').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('adjReason').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitAdjust();
  });
  document.getElementById('adjQty').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitAdjust();
  });
  document.getElementById('newPw2').addEventListener('keydown', e => {
    if (e.key === 'Enter') changePw();
  });
  // recipeMenuName picker is wired in _setupRecipeMenuPicker (called on first open).
  document.getElementById('ingNameKo').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveIngredient();
  });
});

// ══════════════════════════════════════════════
// 탭
// ══════════════════════════════════════════════
function showTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.side-nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
  // 탑바 타이틀 업데이트
  const titleEl = document.getElementById('topBarTitle');
  if (titleEl) { const span = btn.querySelector('span[data-i18n]'); if (span) titleEl.textContent = btn.textContent.trim(); }
  if (id === 'dashboard')   loadDashboard();
  if (id === 'ingredients') loadIngredients();
  if (id === 'menu')        loadMenuTab();
  if (id === 'options')     loadOptionsTab();
  if (id === 'recipes')     { loadRecipes(); loadSizeRecipes(); }
  if (id === 'adjust')      loadAdjust();
  if (id === 'daily')       loadDaily();
  if (id === 'history')     loadHistory();
  if (id === 'settings')  { loadCashiers(); loadSuppliers(); }
  if (id === 'report')      loadReport();
}

// ══════════════════════════════════════════════
// 초기화
// ══════════════════════════════════════════════
async function init() {
  syncCatDatalist();
  await loadIngredients(false);
  await loadDashboard();
}

// ══════════════════════════════════════════════
// 대시보드
// ══════════════════════════════════════════════
async function loadDashboard() {
  try {
    const resp = await apiFetch('/api/dashboard', { headers: hdr() });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const d = await resp.json();
    ingredients = d.ingredients;

    const total = d.ingredients.length;
    const low = d.low_stock.length;
    const sg = document.getElementById('statGrid');
    sg.innerHTML = `
      <div class="stat"><div class="num">${esc(String(total))}</div><div class="lbl">${t('stat_total_ing')}</div></div>
      <div class="stat ${low > 0 ? 'danger' : ''}"><div class="num">${esc(String(low))}</div><div class="lbl">${t('stat_low_ing')}</div></div>
    `;

    const ls = document.getElementById('lowStockSection');
    if (low > 0) {
      ls.classList.remove('hidden');
      const ll = document.getElementById('lowList');
      ll.innerHTML = '';
      d.low_stock.forEach(i => {
        const orderQty = Math.ceil(i.min_qty * 2 - i.current_qty);
        const div = document.createElement('div');
        div.className = 'low-item';
        div.innerHTML = `
          <div>
            <div class="name">${esc(i.name_ko)}</div>
            <div style="font-size:.75rem;color:var(--soft)">${esc(i.name_ar)}</div>
          </div>
          <div style="text-align:right">
            <div class="qty">${t('low_item_cur')} ${esc(String(i.current_qty))}${esc(i.unit)} / ${t('low_item_min')} ${esc(String(i.min_qty))}${esc(i.unit)}</div>
            <div style="font-size:.75rem;color:var(--danger);margin-top:.2rem">📦 ${esc(String(orderQty))}${esc(i.unit)} ${t('order_needed')}</div>
          </div>
        `;
        ll.appendChild(div);
      });
    } else {
      ls.classList.add('hidden');
    }

    // 유통기한 D-7 경고
    const es = document.getElementById('expirySection');
    const expiring = d.expiring_soon || [];
    if (expiring.length > 0) {
      es.classList.remove('hidden');
      const el = document.getElementById('expiryList');
      el.innerHTML = '';
      expiring.forEach(i => {
        const daysLeft = i.days_left;
        let badge, badgeColor;
        if (daysLeft < 0) { badge = t('expired_badge'); badgeColor = '#6b7280'; }
        else if (daysLeft === 0) { badge = 'D-Day'; badgeColor = 'var(--danger)'; }
        else { badge = `D-${daysLeft}`; badgeColor = daysLeft <= 3 ? 'var(--danger)' : 'var(--warning, #f59e0b)'; }
        const div = document.createElement('div');
        div.className = 'low-item';
        div.innerHTML = `
          <div>
            <div class="name">${esc(i.name_ko)}</div>
            <div style="font-size:.75rem;color:var(--soft)">${esc(i.expiry_date)}</div>
          </div>
          <div style="font-size:.85rem;font-weight:700;color:${badgeColor};padding:.2rem .6rem;border:1px solid ${badgeColor};border-radius:.4rem">${esc(badge)}</div>
        `;
        el.appendChild(div);
      });
    } else {
      es.classList.add('hidden');
    }

    const tb = document.getElementById('recentHistTb');
    tb.innerHTML = '';
    d.recent_history.forEach(h => tb.appendChild(buildHistRow(h)));

    updateLowStockBadge(low);
    loadBudgetTracker();
    loadSalesChart(currentSalesPeriod);
  } catch (e) {
    document.getElementById('statGrid').innerHTML = `<div class="alert alert-danger">${t('err_load_data')}</div>`;
  }
}

// ══════════════════════════════════════════════
// 판매 차트
// ══════════════════════════════════════════════
let salesChartInstance = null;
let currentSalesPeriod = 'day';

function setSalesPeriod(period, btn) {
  document.querySelectorAll('.chart-period-btns button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSalesPeriod = period;
  loadSalesChart(period);
}

async function loadSalesChart(period) {
  try {
    const resp = await apiFetch(`/api/sales/summary?period=${encodeURIComponent(period)}`, { headers: hdr() });
    if (!resp.ok) return;
    const d = await resp.json();

    // 통계 카드
    const statsRow = document.getElementById('salesStatsRow');
    if (statsRow) {
      statsRow.innerHTML = `
        <div class="chart-stat"><div class="chart-stat-val">${(d.totals?.total_revenue || 0).toLocaleString()}</div><div class="chart-stat-label">IQD</div></div>
        <div class="chart-stat"><div class="chart-stat-val">${d.totals?.total_orders || 0}</div><div class="chart-stat-label">${period === 'day' ? t('stat_today_orders') : period === 'week' ? t('stat_week_orders') : t('stat_month_orders')}</div></div>
        <div class="chart-stat"><div class="chart-stat-val">${(d.today?.revenue || 0).toLocaleString()}</div><div class="chart-stat-label">${t('stat_today_revenue')}</div></div>
        <div class="chart-stat"><div class="chart-stat-val">${d.today?.order_count || 0}</div><div class="chart-stat-label">${t('stat_today_order_count')}</div></div>
      `;
    }

    // 바 차트
    const canvas = document.getElementById('salesChart');
    if (canvas && d.daily && d.daily.length) {
      const labels = d.daily.map(r => r.day);
      const revenues = d.daily.map(r => r.revenue);
      if (salesChartInstance) salesChartInstance.destroy();
      salesChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'IQD',
            data: revenues,
            backgroundColor: 'rgba(16,185,129,.7)',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 10 } } },
            y: { ticks: { font: { size: 10 }, callback: v => v.toLocaleString() } }
          }
        }
      });
    }

    // TOP5 리스트
    const top5 = document.getElementById('top5List');
    if (top5 && d.top5 && d.top5.length) {
      const maxQty = Math.max(...d.top5.map(r => r.total_qty), 1);
      top5.innerHTML = d.top5.map(r => `
        <div class="top5-item">
          <div class="top5-name">${esc(r.menu_item)}</div>
          <div class="top5-bar-wrap"><div class="top5-bar" style="width:${Math.round(r.total_qty / maxQty * 100)}%"></div></div>
          <div class="top5-qty">${r.total_qty}</div>
        </div>
      `).join('');
    }
  } catch (e) {
    // 차트 로드 실패 시 무시
  }
}

function buildHistRow(h, showActions = false) {
  const tr = document.createElement('tr');
  const badge = h.change_type === 'in'
    ? `<span class="badge badge-in">${t('badge_in')}</span>`
    : `<span class="badge badge-out">${t('badge_out')}</span>`;
  const dt = new Date(h.created_at + (h.created_at.includes('Z') ? '' : 'Z'))
    .toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const actionTd = showActions ? `
    <td style="white-space:nowrap">
      <button class="btn btn-sm btn-outline" style="padding:.2rem .5rem;font-size:.75rem" onclick="openHistEditModal(${h.id})">${t('btn_edit')}</button>
      <button class="btn btn-sm btn-danger" style="padding:.2rem .5rem;font-size:.75rem;margin-left:.25rem" onclick="deleteHistEntry(${h.id})">${t('btn_delete')}</button>
    </td>` : '';
  tr.innerHTML = `
    <td>${esc(h.ingredient_name)}</td>
    <td>${badge}</td>
    <td><b>${esc(String(h.quantity))}</b></td>
    <td style="font-size:.8rem;color:var(--soft)">${esc(h.reason || '-')}</td>
    <td class="hist-date">${esc(dt)}</td>
    ${actionTd}
  `;
  return tr;
}

// ══════════════════════════════════════════════
// 재료 관리
// ══════════════════════════════════════════════
const DEFAULT_CATEGORIES = [
  { name: '시럽',   emoji: '🍯', nameAr: 'سيروب' },
  { name: '소스',   emoji: '🥣', nameAr: 'صوص'   },
  { name: '스무디', emoji: '🥤', nameAr: 'سموذي' },
  { name: '파우더', emoji: '🌿', nameAr: 'مسحوق' },
  { name: '과육',   emoji: '🍋', nameAr: 'عصير'  },
  { name: '기타',   emoji: '📦', nameAr: 'أخرى'  },
];
function loadCatStore() {
  try { return JSON.parse(localStorage.getItem('mr_kim_categories')) || DEFAULT_CATEGORIES; }
  catch { return DEFAULT_CATEGORIES; }
}
function saveCatStore(cats) {
  localStorage.setItem('mr_kim_categories', JSON.stringify(cats));
}
function syncCatConstants() {
  const cats = loadCatStore();
  CATEGORY_ORDER = cats.map(c => c.name);
  CATEGORY_EMOJI = Object.fromEntries(cats.map(c => [c.name, c.emoji || '📦']));
  CATEGORY_AR    = Object.fromEntries(cats.map(c => [c.name, c.nameAr || '']));
}
function syncCatDatalist() {
  const dl = document.getElementById('catOptionList');
  if (!dl) return;
  dl.innerHTML = loadCatStore().map(c => `<option value="${esc(c.name)}">`).join('');
}
let CATEGORY_ORDER, CATEGORY_EMOJI, CATEGORY_AR;
syncCatConstants();

function fmtQty(i) {
  return `${i.current_qty} ${i.unit}`;
}

async function loadIngredients(render = true) {
  try {
    const resp = await apiFetch('/api/ingredients', { headers: hdr() });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const d = await resp.json();
    ingredients = d;
    if (!render) return;

    const container = document.getElementById('ingCategoryContainer');
    if (!d.length) {
      container.innerHTML = `<div class="card"><p style="text-align:center;color:var(--soft);padding:1.5rem">${t('ing_empty')}</p></div>`;
      return;
    }

    // 카테고리별 그룹핑
    const groups = {};
    d.forEach(i => {
      const cat = i.category || '기타';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(i);
    });

    const orderedCats = [...CATEGORY_ORDER, ...Object.keys(groups).filter(c => !CATEGORY_ORDER.includes(c))];

    container.innerHTML = orderedCats.map(cat => {
      const items = groups[cat] || [];
      const emoji = CATEGORY_EMOJI[cat] || '📦';

      if (!items.length) {
        return `<div class="card" style="margin-bottom:1rem;opacity:.55">
          <h3 style="margin-bottom:.5rem;font-size:1rem;color:var(--green)">${emoji} ${cat} <span class="ar" style="font-size:.9rem;color:var(--soft);font-weight:400;margin-right:.4rem">${CATEGORY_AR[cat] || ''}</span><span style="font-size:.8rem;color:var(--soft);font-weight:400">(0)</span></h3>
          <p style="text-align:center;color:var(--soft);font-size:.85rem;padding:.6rem 0">${t('ing_empty_cat')}</p>
        </div>`;
      }

      const rows = items.map(i => {
        const status = i.current_qty === 0
          ? `<span class="badge badge-danger">${t('status_out')}</span>`
          : i.current_qty <= i.min_qty
            ? `<span class="badge badge-warn">${t('status_low')}</span>`
            : `<span class="badge badge-ok">${t('status_ok')}</span>`;
        const cls = i.current_qty === 0 ? 'qty-danger' : i.current_qty <= i.min_qty ? 'qty-warn' : 'qty-ok';
        const rowCls = i.current_qty <= i.min_qty ? ' class="ing-row-low"' : '';
        const locs = Array.isArray(i.locations) ? i.locations : [];
        const locChips = locs.length
          ? locs.map(l => `<span class="loc-chip" dir="ltr">${esc(l.location_code)}·${l.qty}</span>`).join(' ')
          : `<span style="color:var(--soft);font-size:.8rem">—</span>`;
        const thumb = i.image_path
          ? `<img src="${esc(i.image_path)}" alt="" loading="lazy" data-action="zoom" data-img-src="${esc(i.image_path)}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;cursor:zoom-in;border:1px solid var(--off);vertical-align:middle">`
          : `<span style="display:inline-block;width:36px;height:36px;border-radius:6px;background:var(--off);color:var(--soft);font-size:1rem;text-align:center;line-height:36px;vertical-align:middle">📦</span>`;
        const supLine = i.supplier_name
          ? `<div style="font-size:.7rem;color:var(--soft);margin-top:.15rem">🚚 ${esc(i.supplier_name)}${i.supplier_phone ? ` · ${esc(i.supplier_phone)}` : ''}</div>`
          : '';
        const originLine = i.origin
          ? `<div style="font-size:.7rem;color:var(--soft)">🌍 ${esc(i.origin)}</div>`
          : '';
        const recvLine = i.received_date
          ? `<div style="font-size:.7rem;color:var(--soft)">📥 ${esc(i.received_date)}</div>`
          : '';
        return `<tr${rowCls} data-ing-id="${i.id}" data-del-id="${i.id}" data-del-name="${esc(i.name_ko)}">
          <td>${thumb}</td>
          <td>
            <b>${esc(i.name_ko)}</b>
            ${i.market_name ? `<div style="font-size:.7rem;color:var(--soft)">🏷️ ${esc(i.market_name)}</div>` : ''}
            ${originLine}
            ${supLine}
            ${recvLine}
          </td>
          <td class="ar">${esc(i.name_ar || '-')}</td>
          <td class="${cls} ing-qty">${fmtQty(i)}</td>
          <td>${esc(String(i.min_qty))} ${esc(i.unit)}</td>
          <td>${i.cost_per_unit.toLocaleString()} IQD${i.market_price ? `<div style="font-size:.7rem;color:var(--soft)">${t('label_market_price_short') || 'MP'}: ${Number(i.market_price).toLocaleString()}</div>` : ''}</td>
          <td>${status}</td>
          <td style="white-space:normal;max-width:160px">
            ${locChips}
            <button class="btn btn-outline btn-sm" style="margin-${currentLang==='ar'?'right':'left'}:.25rem;font-size:.7rem;padding:.2rem .4rem" data-action="loc" data-ing-id="${i.id}" data-ing-name="${esc(i.name_ko)}">${t('btn_loc')}</button>
          </td>
          <td style="white-space:nowrap">
            <button class="btn btn-outline btn-sm" data-action="edit" data-ing-idx="${d.indexOf(i)}">${t('btn_edit')}</button>
            <button class="btn btn-danger btn-sm" data-action="del" data-ing-id="${i.id}" data-ing-name="${esc(i.name_ko)}">${t('btn_delete')}</button>
          </td>
        </tr>`;
      }).join('');
      return `<div class="card" style="margin-bottom:1rem">
        <h3 style="margin-bottom:.75rem;font-size:1rem;color:var(--green)">${emoji} ${cat} <span class="ar" style="font-size:.9rem;color:var(--soft);font-weight:400;margin-right:.4rem">${CATEGORY_AR[cat] || ''}</span><span style="font-size:.8rem;color:var(--soft);font-weight:400">(${items.length})</span></h3>
        <div class="tbl-wrap"><table>
          <thead><tr>
            <th style="width:48px"></th>
            <th>${t('col_name_ko')}</th>
            <th>${t('col_name_ar')}</th>
            <th>${t('col_cur_qty')}</th>
            <th>${t('col_min_qty')}</th>
            <th>${t('col_cost')}</th>
            <th>${t('col_status')}</th>
            <th>${t('col_location')}</th>
            <th>${t('col_manage')}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>`;
    }).join('');

    // 이벤트 바인딩
    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      const idx = parseInt(btn.dataset.ingIdx);
      btn.addEventListener('click', () => editIng(d[idx]));
    });
    container.querySelectorAll('[data-action="del"]').forEach(btn => {
      btn.addEventListener('click', () => delIng(btn.dataset.ingId, btn.dataset.ingName));
    });
    container.querySelectorAll('[data-action="loc"]').forEach(btn => {
      btn.addEventListener('click', () => openLocModal(btn.dataset.ingId, btn.dataset.ingName));
    });
    container.querySelectorAll('[data-action="zoom"]').forEach(img => {
      img.addEventListener('click', () => openImageZoom(img.dataset.imgSrc));
    });

  } catch (e) {
    if (render) {
      document.getElementById('ingCategoryContainer').innerHTML = `<div class="card"><p style="text-align:center;color:var(--red);padding:1.5rem">${t('err_load_retry')}</p></div>`;
    }
  }
}

// ══════════════════════════════════════════════
// 카테고리 관리
// ══════════════════════════════════════════════
let editingCatIdx = -1;

function toggleCatMgr() {
  const body = document.getElementById('catMgrBody');
  const icon = document.getElementById('catMgrToggle');
  body.classList.toggle('hidden');
  icon.textContent = body.classList.contains('hidden') ? t('cat_toggle_expand') : t('cat_toggle_collapse');
  if (!body.classList.contains('hidden')) renderCatManager();
}

function renderCatManager() {
  const cats = loadCatStore();
  const list = document.getElementById('catMgrList');
  if (!list) return;
  if (!cats.length) {
    list.innerHTML = `<p style="font-size:.82rem;color:var(--soft);margin-bottom:.5rem">${t('cat_empty')}</p>`;
    return;
  }
  list.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:.84rem;margin-bottom:.25rem">
    <thead><tr style="color:var(--soft);font-size:.76rem;border-bottom:1px solid var(--border)">
      <th style="text-align:left;padding:.2rem .4rem;width:2.5rem">${t('col_emoji')}</th>
      <th style="text-align:left;padding:.2rem .4rem">${t('col_name_lang')}</th>
      <th style="text-align:left;padding:.2rem .4rem">${t('label_cat_name_ar')}</th>
      <th style="width:9rem"></th>
    </tr></thead>
    <tbody>${cats.map((c, idx) => `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:.3rem .4rem;text-align:center;font-size:1.1rem">${c.emoji || '📦'}</td>
      <td style="padding:.3rem .4rem"><b>${esc(c.name)}</b></td>
      <td style="padding:.3rem .4rem" class="ar" dir="rtl">${esc(c.nameAr || '')}</td>
      <td style="padding:.3rem .4rem;text-align:right;white-space:nowrap">
        ${idx > 0 ? `<button class="btn btn-outline btn-sm" style="padding:.1rem .35rem;min-width:0" onclick="moveCat(${idx},-1)">↑</button>` : '<span style="display:inline-block;width:1.9rem"></span>'}
        ${idx < cats.length - 1 ? `<button class="btn btn-outline btn-sm" style="padding:.1rem .35rem;min-width:0" onclick="moveCat(${idx},1)">↓</button>` : '<span style="display:inline-block;width:1.9rem"></span>'}
        <button class="btn btn-outline btn-sm" style="padding:.1rem .45rem;min-width:0" onclick="startEditCat(${idx})">✎</button>
        <button class="btn btn-danger btn-sm" style="padding:.1rem .45rem;min-width:0" onclick="deleteCat(${idx})">✕</button>
      </td>
    </tr>`).join('')}</tbody>
  </table>`;
}

function submitCatForm() {
  if (editingCatIdx >= 0) saveEditCat(editingCatIdx);
  else addCategory();
}

function addCategory() {
  const name  = document.getElementById('newCatName').value.trim();
  const emoji = document.getElementById('newCatEmoji').value.trim() || '📦';
  const nameAr = document.getElementById('newCatAr').value.trim();
  const msg   = document.getElementById('catMgrMsg');
  if (!name) { msg.style.color = 'var(--red)'; msg.textContent = t('cat_err_name'); return; }
  const cats = loadCatStore();
  if (cats.find(c => c.name === name)) { msg.style.color = 'var(--red)'; msg.textContent = t('cat_err_dup'); return; }
  cats.push({ name, emoji, nameAr });
  saveCatStore(cats);
  syncCatConstants();
  syncCatDatalist();
  document.getElementById('newCatName').value = '';
  document.getElementById('newCatEmoji').value = '';
  document.getElementById('newCatAr').value = '';
  msg.style.color = 'var(--green)'; msg.textContent = t('cat_added').replace('${name}', name);
  setTimeout(() => { msg.textContent = ''; }, 2500);
  renderCatManager();
  loadIngredients();
}

function startEditCat(idx) {
  editingCatIdx = idx;
  const c = loadCatStore()[idx];
  document.getElementById('newCatName').value  = c.name;
  document.getElementById('newCatEmoji').value = c.emoji || '';
  document.getElementById('newCatAr').value    = c.nameAr || '';
  document.getElementById('catSubmitBtn').textContent = t('cat_btn_save_edit');
  document.getElementById('catCancelBtn').classList.remove('hidden');
  const msg = document.getElementById('catMgrMsg');
  msg.style.color = 'var(--soft)'; msg.textContent = t('cat_editing').replace('${name}', c.name);
  document.getElementById('newCatName').focus();
}

function saveEditCat(idx) {
  const name   = document.getElementById('newCatName').value.trim();
  const emoji  = document.getElementById('newCatEmoji').value.trim() || '📦';
  const nameAr = document.getElementById('newCatAr').value.trim();
  const msg    = document.getElementById('catMgrMsg');
  if (!name) { msg.style.color = 'var(--red)'; msg.textContent = t('cat_err_name'); return; }
  const cats = loadCatStore();
  if (name !== cats[idx].name && cats.find(c => c.name === name)) {
    msg.style.color = 'var(--red)'; msg.textContent = t('cat_err_dup'); return;
  }
  cats[idx] = { name, emoji, nameAr };
  saveCatStore(cats);
  syncCatConstants();
  syncCatDatalist();
  cancelEditCat();
  msg.style.color = 'var(--green)'; msg.textContent = t('cat_saved');
  setTimeout(() => { msg.textContent = ''; }, 2500);
  renderCatManager();
  loadIngredients();
}

function cancelEditCat() {
  editingCatIdx = -1;
  document.getElementById('newCatName').value  = '';
  document.getElementById('newCatEmoji').value = '';
  document.getElementById('newCatAr').value    = '';
  document.getElementById('catSubmitBtn').textContent = t('cat_btn_add');
  document.getElementById('catCancelBtn').classList.add('hidden');
}

function deleteCat(idx) {
  const cats = loadCatStore();
  const name = cats[idx].name;
  if (!confirm(t('cat_confirm_del').replace('${name}', name))) return;
  cats.splice(idx, 1);
  saveCatStore(cats);
  syncCatConstants();
  syncCatDatalist();
  if (editingCatIdx === idx) cancelEditCat();
  renderCatManager();
  loadIngredients();
}

function moveCat(idx, dir) {
  const cats = loadCatStore();
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= cats.length) return;
  [cats[idx], cats[newIdx]] = [cats[newIdx], cats[idx]];
  saveCatStore(cats);
  syncCatConstants();
  renderCatManager();
  loadIngredients();
}

const ING_MODAL_FIELDS = [
  'ingNameKo', 'ingNameAr', 'ingCurQty', 'ingMinQty', 'ingCost', 'ingCapacityMl',
  'ingCategory', 'ingExpiryDate',
  'ingOrigin', 'ingMarketName', 'ingQtyPerBox', 'ingNumBoxes', 'ingMarketPrice',
  'ingReceivedDate', 'ingImagePath',
];

function openIngModal() {
  document.getElementById('ingModalTitle').textContent = t('modal_ing_title');
  document.getElementById('ingId').value = '';
  ING_MODAL_FIELDS.forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('ingUnit').value = '병';
  const supSel = document.getElementById('ingSupplierId');
  if (supSel) supSel.value = '';
  const fileInput = document.getElementById('ingImageFile');
  if (fileInput) fileInput.value = '';
  document.getElementById('ingImagePreviewWrap').style.display = 'none';
  document.getElementById('ingImagePreview').src = '';
  document.getElementById('ingCurQty').readOnly = false;
  const hint = document.getElementById('ingCurQtyHint'); if (hint) hint.style.display = 'none';
  document.getElementById('ingModalMsg').innerHTML = '';
  loadSuppliers();
  document.getElementById('ingModal').classList.remove('hidden');
}

function editIng(i) {
  document.getElementById('ingModalTitle').textContent = t('modal_ing_edit_title');
  document.getElementById('ingId').value = i.id;
  document.getElementById('ingNameKo').value = i.name_ko || '';
  document.getElementById('ingNameAr').value = i.name_ar || '';
  document.getElementById('ingUnit').value = i.unit;
  document.getElementById('ingCurQty').value = i.current_qty;
  document.getElementById('ingMinQty').value = i.min_qty;
  document.getElementById('ingCost').value = i.cost_per_unit;
  document.getElementById('ingCapacityMl').value = i.capacity_ml || 0;
  document.getElementById('ingCategory').value = i.category || '';
  document.getElementById('ingExpiryDate').value = i.expiry_date || '';
  document.getElementById('ingOrigin').value = i.origin || '';
  document.getElementById('ingMarketName').value = i.market_name || '';
  document.getElementById('ingQtyPerBox').value = i.qty_per_box != null ? i.qty_per_box : '';
  document.getElementById('ingNumBoxes').value = i.num_boxes != null ? i.num_boxes : '';
  document.getElementById('ingMarketPrice').value = i.market_price != null ? i.market_price : '';
  document.getElementById('ingReceivedDate').value = i.received_date || '';
  document.getElementById('ingImagePath').value = i.image_path || '';
  document.getElementById('ingImageFile').value = '';
  if (i.image_path) {
    document.getElementById('ingImagePreview').src = i.image_path;
    document.getElementById('ingImagePreviewWrap').style.display = 'block';
  } else {
    document.getElementById('ingImagePreview').src = '';
    document.getElementById('ingImagePreviewWrap').style.display = 'none';
  }
  document.getElementById('ingModalMsg').innerHTML = '';
  loadSuppliers().then(() => {
    const supSel = document.getElementById('ingSupplierId');
    if (supSel) supSel.value = i.supplier_id != null ? String(i.supplier_id) : '';
  });
  recomputeTotalQty();
  document.getElementById('ingModal').classList.remove('hidden');
}

async function saveIngredient() {
  const id = document.getElementById('ingId').value;
  const supplierIdVal = document.getElementById('ingSupplierId').value;
  const supplierIdNum = supplierIdVal ? parseInt(supplierIdVal, 10) : null;
  const supplierName = supplierIdNum
    ? (SUPPLIERS_CACHE.find(s => s.id === supplierIdNum)?.name || null)
    : null;
  const numOrNull = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  const body = {
    name_ko: document.getElementById('ingNameKo').value.trim(),
    name_ar: document.getElementById('ingNameAr').value.trim(),
    unit: document.getElementById('ingUnit').value,
    current_qty: parseFloat(document.getElementById('ingCurQty').value) || 0,
    min_qty: parseFloat(document.getElementById('ingMinQty').value) || 1,
    cost_per_unit: parseFloat(document.getElementById('ingCost').value) || 0,
    capacity_ml: parseInt(document.getElementById('ingCapacityMl').value) || 0,
    category: document.getElementById('ingCategory').value.trim() || undefined,
    expiry_date: document.getElementById('ingExpiryDate').value || null,
    origin: document.getElementById('ingOrigin').value.trim() || null,
    market_name: document.getElementById('ingMarketName').value.trim() || null,
    qty_per_box: numOrNull(document.getElementById('ingQtyPerBox').value),
    num_boxes: numOrNull(document.getElementById('ingNumBoxes').value),
    market_price: numOrNull(document.getElementById('ingMarketPrice').value),
    received_date: document.getElementById('ingReceivedDate').value || null,
    image_path: document.getElementById('ingImagePath').value || null,
    supplier_id: supplierIdNum,
    supplier: supplierName, // legacy text column kept in sync
  };
  if (!body.name_ko) {
    document.getElementById('ingModalMsg').innerHTML = `<div class="alert alert-danger">${t('err_ing_name')}</div>`;
    return;
  }
  lockBtn('ingSaveBtn');
  try {
    const url = id ? `/api/ingredients/${id}` : '/api/ingredients';
    const method = id ? 'PUT' : 'POST';
    const resp = await apiFetch(url, { method, headers: hdr(), body: JSON.stringify(body) });
    const r = await resp.json();
    if (!resp.ok || !r.success) {
      document.getElementById('ingModalMsg').innerHTML = `<div class="alert alert-danger">${esc(r.error || t('err_save_net'))}</div>`;
      return;
    }
    const newId = id || r.id;
    const fileInput = document.getElementById('ingImageFile');
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (file && newId) {
      const fd = new FormData();
      fd.append('image', file);
      const upResp = await fetch(`/api/ingredients/${newId}/image`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: fd,
      });
      if (!upResp.ok) {
        const ud = await upResp.json().catch(() => ({}));
        document.getElementById('ingModalMsg').innerHTML = `<div class="alert alert-danger">${esc(ud.error || 'Image upload failed')}</div>`;
        loadIngredients();
        return;
      }
    }
    closeModal('ingModal');
    loadIngredients();
  } catch (e) {
    document.getElementById('ingModalMsg').innerHTML = `<div class="alert alert-danger">${t('err_save_net')}</div>`;
  } finally {
    unlockBtn('ingSaveBtn');
  }
}

async function delIng(id, name) {
  if (!confirm(`"${name}" ${t('confirm_del_ing')}`)) return;
  try {
    const resp = await apiFetch(`/api/ingredients/${id}`, { method: 'DELETE', headers: hdr() });
    const r = await resp.json().catch(() => ({}));
    if (!resp.ok || r.success === false) {
      alert(r.error || t('err_del'));
      return;
    }
    loadIngredients();
  } catch (e) {
    alert(t('err_del'));
  }
}

// ══════════════════════════════════════════════
// 위치 관리 (ingredient_locations)
// ══════════════════════════════════════════════
const LOC_CODE_RE = /^[1-9][A-E][1-9]$/;

function buildLocSelect(id, values) {
  const sel = document.getElementById(id);
  sel.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join('');
  sel.addEventListener('change', updateLocPreview);
}

function updateLocPreview() {
  const s = document.getElementById('locShelf').value;
  const c = document.getElementById('locColumn').value;
  const r = document.getElementById('locRow').value;
  document.getElementById('locPreview').textContent = `${s}${c}${r}`;
}

async function openLocModal(ingId, ingName) {
  document.getElementById('locModalIngId').value = ingId;
  document.getElementById('locModalIngName').textContent = ingName;
  document.getElementById('locModalMsg').innerHTML = '';
  document.getElementById('locQty').value = '0';
  if (!document.getElementById('locShelf').options.length) {
    buildLocSelect('locShelf', ['1','2','3','4','5','6','7','8','9']);
    buildLocSelect('locColumn', ['A','B','C','D','E']);
    buildLocSelect('locRow', ['1','2','3','4','5','6','7','8','9']);
  }
  document.getElementById('locShelf').value = '2';
  document.getElementById('locColumn').value = 'A';
  document.getElementById('locRow').value = '2';
  updateLocPreview();
  await refreshLocList(ingId);
  document.getElementById('locModal').classList.remove('hidden');
}

async function refreshLocList(ingId) {
  const list = document.getElementById('locList');
  try {
    const resp = await apiFetch(`/api/ingredients`, { headers: hdr() });
    const data = await resp.json();
    const arr = Array.isArray(data) ? data : (data.data || []);
    const ing = arr.find(x => String(x.id) === String(ingId));
    const locs = (ing && ing.locations) || [];
    if (!locs.length) {
      list.innerHTML = `<p style="color:var(--soft);font-size:.85rem;text-align:center;padding:.5rem 0">${t('loc_empty')}</p>`;
      return;
    }
    list.innerHTML = locs.map(l => `
      <div style="display:flex;align-items:center;gap:.5rem;padding:.4rem .5rem;border:1px solid var(--border);border-radius:6px;margin-bottom:.35rem">
        <span class="loc-chip" dir="ltr" style="min-width:40px;text-align:center">${esc(l.location_code)}</span>
        <input type="number" min="0" step="0.01" value="${l.qty}" id="locRowQty_${l.id}" style="width:80px;padding:.3rem">
        <button class="btn btn-outline btn-sm" onclick="saveLocRow(${l.id}, ${ingId})" style="font-size:.7rem;padding:.25rem .5rem">${t('btn_loc_save')}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteLoc(${l.id}, ${ingId})" style="font-size:.7rem;padding:.25rem .5rem">${t('btn_delete')}</button>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = `<p style="color:var(--red);font-size:.85rem">${t('err_load_retry')}</p>`;
  }
}

async function submitLocForm() {
  const ingId = document.getElementById('locModalIngId').value;
  const code = document.getElementById('locPreview').textContent.trim();
  const qty = parseFloat(document.getElementById('locQty').value);
  const msg = document.getElementById('locModalMsg');
  if (!LOC_CODE_RE.test(code)) {
    msg.innerHTML = `<div class="alert alert-danger">${t('err_loc_format')}</div>`;
    return;
  }
  if (!(qty >= 0)) {
    msg.innerHTML = `<div class="alert alert-danger">${t('err_loc_qty')}</div>`;
    return;
  }
  try {
    const resp = await apiFetch(`/api/ingredients/${ingId}/locations`, {
      method: 'POST', headers: hdr(),
      body: JSON.stringify({ location_code: code, qty })
    });
    const r = await resp.json().catch(() => ({}));
    if (!resp.ok || r.success === false) {
      msg.innerHTML = `<div class="alert alert-danger">${esc(r.error || t('err_save_net'))}</div>`;
      return;
    }
    msg.innerHTML = '';
    document.getElementById('locQty').value = '0';
    await refreshLocList(ingId);
    loadIngredients();
  } catch (e) {
    msg.innerHTML = `<div class="alert alert-danger">${t('err_save_net')}</div>`;
  }
}

async function saveLocRow(locId, ingId) {
  const qty = parseFloat(document.getElementById(`locRowQty_${locId}`).value);
  if (!(qty >= 0)) {
    alert(t('err_loc_qty'));
    return;
  }
  try {
    const resp = await apiFetch(`/api/ingredient-locations/${locId}`, {
      method: 'PATCH', headers: hdr(),
      body: JSON.stringify({ qty })
    });
    const r = await resp.json().catch(() => ({}));
    if (!resp.ok || r.success === false) {
      alert(r.error || t('err_save_net'));
      return;
    }
    await refreshLocList(ingId);
    loadIngredients();
  } catch (e) {
    alert(t('err_save_net'));
  }
}

async function deleteLoc(locId, ingId) {
  if (!confirm(t('confirm_del_loc'))) return;
  try {
    const resp = await apiFetch(`/api/ingredient-locations/${locId}`, {
      method: 'DELETE', headers: hdr()
    });
    const r = await resp.json().catch(() => ({}));
    if (!resp.ok || r.success === false) {
      alert(r.error || t('err_del'));
      return;
    }
    await refreshLocList(ingId);
    loadIngredients();
  } catch (e) {
    alert(t('err_del'));
  }
}

// ══════════════════════════════════════════════
// 레시피 & 원가
// ══════════════════════════════════════════════
async function loadRecipes() {
  try {
    const resp = await apiFetch('/api/recipes', { headers: hdr() });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const d = await resp.json();
    recipes = d;

    const grouped = {};
    d.forEach(r => {
      if (!grouped[r.menu_item]) grouped[r.menu_item] = [];
      grouped[r.menu_item].push(r);
    });

    const tb = document.getElementById('recipeTb');
    tb.innerHTML = '';
    const menuNames = Object.keys(grouped);

    if (!menuNames.length) {
      tb.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--soft);padding:1.5rem">${t('recipe_empty')}</td></tr>`;
    } else {
      // menu_category별로 다시 그룹핑
      const byCategory = {};
      menuNames.forEach(menu => {
        const cat = (grouped[menu][0] && grouped[menu][0].menu_category) ? grouped[menu][0].menu_category : '기타';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(menu);
      });

      const MENU_CAT_EMOJI = { '음료': '☕', '스무디': '🥤', '디저트': '🍰', '기타': '📦' };

      Object.keys(byCategory).forEach(cat => {
        const catMenus = byCategory[cat];
        const emoji = MENU_CAT_EMOJI[cat] || '📋';

        // 카테고리 헤더 행
        const headerTr = document.createElement('tr');
        headerTr.innerHTML = `<td colspan="6" style="background:var(--bg2,#f4f4f0);padding:.5rem .75rem;font-weight:700;color:var(--green);border-top:2px solid var(--green)">${emoji} ${esc(cat)} <span style="font-size:.8rem;color:var(--soft);font-weight:400">(${catMenus.length}${t('recipe_cat_count') ? ' '+t('recipe_cat_count') : ''})</span></td>`;
        tb.appendChild(headerTr);

        catMenus.forEach(menu => {
          const items = grouped[menu];
          const totalCost = items.reduce((s, i) => {
            const uc = i.capacity_ml > 0 ? i.cost_per_unit / i.capacity_ml : i.cost_per_unit;
            return s + i.quantity * uc;
          }, 0);
          items.forEach((item, idx) => {
            const tr = document.createElement('tr');
            let html = '';
            if (idx === 0) {
              html += `<td rowspan="${items.length}"><b>${esc(menu)}</b></td>`;
            }
            const itemUc = item.capacity_ml > 0 ? item.cost_per_unit / item.capacity_ml : item.cost_per_unit;
            html += `
              <td>${esc(item.name_ko)}</td>
              <td>${esc(String(item.quantity))} ${esc(item.recipe_unit || 'ml')}</td>
              <td>${esc(item.recipe_unit || 'ml')}</td>
              <td>${Math.round(item.quantity * itemUc).toLocaleString()} IQD</td>
            `;
            if (idx === 0) {
              html += `
                <td rowspan="${items.length}" style="text-align:center">
                  <div style="font-weight:800;color:var(--green)">${Math.round(totalCost).toLocaleString()} IQD</div>
                  <div style="display:flex;gap:.3rem;justify-content:center;margin-top:.4rem">
                    <button class="btn btn-outline btn-sm" data-edit-menu="${esc(menu)}">${t('btn_edit')}</button>
                    <button class="btn btn-danger btn-sm" data-del-menu="${esc(menu)}">${t('btn_delete')}</button>
                  </div>
                </td>
              `;
            }
            tr.innerHTML = html;
            if (idx === 0) {
              tr.querySelector('[data-edit-menu]').addEventListener('click', () => editRecipe(menu));
              tr.querySelector('[data-del-menu]').addEventListener('click', () => delRecipe(menu));
            }
            tb.appendChild(tr);
          });
        });
      });
    }

    // 원가 계산기 select 업데이트
    const sel = document.getElementById('costMenuSel');
    sel.innerHTML = `<option value="">${t('opt_select_menu')}</option>`;
    menuNames.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      sel.appendChild(opt);
    });

    loadAllCosts(grouped);
  } catch (e) {
    document.getElementById('recipeTb').innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--red);padding:1.5rem">${t('err_load')}</td></tr>`;
  }
}

async function _ensureMenuListLoaded() {
  if (Array.isArray(menuState.items) && menuState.items.length > 0) return;
  try {
    const [mRes, cRes] = await Promise.all([
      apiFetch('/api/menu/with-cost', { headers: hdr() }),
      apiFetch('/api/admin/menu/categories', { headers: hdr() }),
    ]);
    if (mRes.ok) menuState.items = await mRes.json();
    if (cRes.ok) menuState.categories = await cRes.json();
  } catch (e) { /* picker will simply have empty list */ }
}

let _recipeMenuPickerReady = false;

function _setupRecipeMenuPicker() {
  if (_recipeMenuPickerReady) return;
  const input = document.getElementById('recipeMenuName');
  const hidden = document.getElementById('recipeMenuItemId');
  const dropdown = document.getElementById('recipeMenuDropdown');
  const catInput = document.getElementById('recipeCategory');
  if (!input || !dropdown) return;

  function pickItem(it) {
    input.value = it.name_en || it.name_ko || it.code || '';
    input.classList.add('selected');
    hidden.value = it.id;
    const cat = (menuState.categories || []).find(c => c.id === it.category_id);
    catInput.value = cat ? (cat.name_en || cat.name_ko || cat.code) : '';
    dropdown.classList.remove('open');
  }

  function renderDropdown(query) {
    const q = (query || '').toLowerCase().trim();
    const list = (menuState.items || []).filter(it => {
      if (!q) return true;
      return (it.name_en && it.name_en.toLowerCase().includes(q))
          || (it.name_ko && it.name_ko.toLowerCase().includes(q))
          || (it.name_ar && it.name_ar.includes(q))
          || (it.code && it.code.toLowerCase().includes(q));
    }).slice(0, 50);
    dropdown.innerHTML = '';
    if (!list.length) {
      dropdown.innerHTML = `<div class="ing-no-result">${t('menu_no_result')}</div>`;
    } else {
      list.forEach(it => {
        const cat = (menuState.categories || []).find(c => c.id === it.category_id);
        const catLabel = cat ? (cat.name_en || cat.code) : '—';
        const div = document.createElement('div');
        div.className = 'ing-dropdown-item';
        div.innerHTML = `<span class="ing-name">${esc(it.name_en || it.name_ko || it.code)}</span><span class="ing-unit">${esc(catLabel)}</span>`;
        div.addEventListener('mousedown', e => { e.preventDefault(); pickItem(it); });
        dropdown.appendChild(div);
      });
    }
    dropdown.classList.add('open');
  }

  input.addEventListener('focus', () => renderDropdown(input.value));
  input.addEventListener('input', () => {
    hidden.value = '';
    input.classList.remove('selected');
    catInput.value = '';
    renderDropdown(input.value);
  });
  input.addEventListener('blur', () => setTimeout(() => dropdown.classList.remove('open'), 150));
  input.addEventListener('keydown', e => {
    const items = [...dropdown.querySelectorAll('.ing-dropdown-item')];
    const active = dropdown.querySelector('.ing-dropdown-item.active');
    let idx = items.indexOf(active);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (active) active.classList.remove('active');
      items[(idx + 1) % items.length]?.classList.add('active');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (active) active.classList.remove('active');
      items[(idx - 1 + items.length) % items.length]?.classList.add('active');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active) active.dispatchEvent(new MouseEvent('mousedown'));
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('open');
    }
  });

  _recipeMenuPickerReady = true;
}

async function openRecipeModal() {
  await _ensureMenuListLoaded();
  _setupRecipeMenuPicker();
  document.getElementById('recipeMenuName').value = '';
  document.getElementById('recipeMenuName').classList.remove('selected');
  document.getElementById('recipeMenuItemId').value = '';
  document.getElementById('recipeCategory').value = '';
  document.getElementById('recipeRows').innerHTML = '';
  document.getElementById('recipeModalMsg').innerHTML = '';
  addRecipeRow();
  document.getElementById('recipeModal').classList.remove('hidden');
}

async function editRecipe(menu) {
  await _ensureMenuListLoaded();
  _setupRecipeMenuPicker();
  const first = recipes.find(r => r.menu_item === menu);
  // try to resolve menu_item_id: prefer the value stored on the recipe row,
  // otherwise match by name against menuState.items.
  let mid = first && first.menu_item_id ? first.menu_item_id : null;
  if (!mid) {
    const match = (menuState.items || []).find(it =>
      it.name_en === menu || it.name_ko === menu || it.code === menu);
    if (match) mid = match.id;
  }
  const matched = mid ? (menuState.items || []).find(it => it.id === mid) : null;
  const nameInput = document.getElementById('recipeMenuName');
  const catInput = document.getElementById('recipeCategory');
  if (matched) {
    nameInput.value = matched.name_en || matched.name_ko || matched.code;
    nameInput.classList.add('selected');
    document.getElementById('recipeMenuItemId').value = matched.id;
    const cat = (menuState.categories || []).find(c => c.id === matched.category_id);
    catInput.value = cat ? (cat.name_en || cat.name_ko || cat.code) : (first?.menu_category || '');
  } else {
    // legacy text-only recipe whose menu was deleted/renamed — show name, leave id empty
    nameInput.value = menu;
    document.getElementById('recipeMenuItemId').value = '';
    catInput.value = first?.menu_category || '';
  }
  document.getElementById('recipeRows').innerHTML = '';
  document.getElementById('recipeModalMsg').innerHTML = '';
  recipes.filter(r => r.menu_item === menu).forEach(item => addRecipeRow(item.ingredient_id, item.quantity, item.recipe_unit || 'ml'));
  document.getElementById('recipeModal').classList.remove('hidden');
}

function addRecipeRow(ingId = '', qty = '', unit = 'ml') {
  const div = document.createElement('div');
  div.className = 'recipe-row';

  // ── searchable ingredient picker ──
  const wrap = document.createElement('div');
  wrap.className = 'ing-search-wrap';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ing-search-input';
  searchInput.autocomplete = 'off';
  searchInput.placeholder = t('opt_select_ing_lbl');

  // hidden value holder — still named rec-ing so saveRecipe() works unchanged
  const hiddenId = document.createElement('input');
  hiddenId.type = 'hidden';
  hiddenId.className = 'rec-ing';

  const dropdown = document.createElement('div');
  dropdown.className = 'ing-dropdown';

  // if editing an existing row, pre-fill
  if (ingId) {
    const existing = ingredients.find(i => i.id == ingId);
    if (existing) {
      searchInput.value = `${existing.name_ko} (${existing.unit})`;
      searchInput.classList.add('selected');
      hiddenId.value = existing.id;
    }
  }

  function renderDropdown(query) {
    const q = query.toLowerCase();
    const filtered = q
      ? ingredients.filter(i =>
          i.name_ko.toLowerCase().includes(q) ||
          (i.name_ar && i.name_ar.includes(q)) ||
          (i.unit && i.unit.toLowerCase().includes(q))
        )
      : ingredients;

    dropdown.innerHTML = '';
    if (!filtered.length) {
      dropdown.innerHTML = `<div class="ing-no-result">${t('ing_no_result')}</div>`;
    } else {
      filtered.forEach(i => {
        const item = document.createElement('div');
        item.className = 'ing-dropdown-item';
        item.innerHTML = `<span class="ing-name">${i.name_ko}</span><span class="ing-unit">${i.unit}</span>`;
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          searchInput.value = `${i.name_ko} (${i.unit})`;
          searchInput.classList.add('selected');
          hiddenId.value = i.id;
          dropdown.classList.remove('open');
        });
        dropdown.appendChild(item);
      });
    }
    dropdown.classList.add('open');
  }

  searchInput.addEventListener('focus', () => renderDropdown(searchInput.value));
  searchInput.addEventListener('input', () => {
    hiddenId.value = '';
    searchInput.classList.remove('selected');
    renderDropdown(searchInput.value);
  });
  searchInput.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.remove('open'), 150);
  });
  searchInput.addEventListener('keydown', e => {
    const items = [...dropdown.querySelectorAll('.ing-dropdown-item')];
    const active = dropdown.querySelector('.ing-dropdown-item.active');
    let idx = items.indexOf(active);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (active) active.classList.remove('active');
      items[(idx + 1) % items.length]?.classList.add('active');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (active) active.classList.remove('active');
      items[(idx - 1 + items.length) % items.length]?.classList.add('active');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active) active.dispatchEvent(new MouseEvent('mousedown'));
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('open');
    }
  });

  wrap.appendChild(searchInput);
  wrap.appendChild(hiddenId);
  wrap.appendChild(dropdown);

  // ── qty input ──
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.className = 'rec-qty';
  qtyInput.value = qty;
  qtyInput.min = 0;
  qtyInput.step = 0.01;
  qtyInput.placeholder = t('ph_qty');
  qtyInput.style.cssText = 'width:90px;padding:.45rem .6rem;border:2px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:.88rem;text-align:center;outline:none';

  // ── unit selector (ml / g) ──
  const unitSel = document.createElement('select');
  unitSel.className = 'rec-unit';
  unitSel.style.cssText = 'padding:.45rem .5rem;border:2px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:.88rem;background:#fff;cursor:pointer;outline:none';
  ['ml', 'g'].forEach(u => {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = u;
    if (u === unit) opt.selected = true;
    unitSel.appendChild(opt);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn-danger btn-sm';
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', () => div.remove());

  div.appendChild(wrap);
  div.appendChild(qtyInput);
  div.appendChild(unitSel);
  div.appendChild(delBtn);
  document.getElementById('recipeRows').appendChild(div);
}

async function saveRecipe() {
  const menu = document.getElementById('recipeMenuName').value.trim();
  const menu_item_id = parseInt(document.getElementById('recipeMenuItemId').value, 10);
  const menu_category = document.getElementById('recipeCategory').value.trim() || '기타';
  const msgEl = document.getElementById('recipeModalMsg');
  if (!menu) { msgEl.innerHTML = `<div class="alert alert-danger">${t('err_menu_name')}</div>`; return; }
  if (!Number.isFinite(menu_item_id)) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_menu_pick')}</div>`;
    return;
  }

  const rows = [...document.querySelectorAll('#recipeRows .recipe-row')];
  const rawItems = rows
    .map(r => ({
      ingredient_id: parseInt(r.querySelector('.rec-ing').value),
      quantity: parseFloat(r.querySelector('.rec-qty').value) || 0,
      unit: r.querySelector('.rec-unit')?.value || 'ml'
    }))
    .filter(i => i.ingredient_id && i.quantity > 0);

  if (!rawItems.length) { msgEl.innerHTML = `<div class="alert alert-danger">${t('err_ing_required')}</div>`; return; }

  // ── 4. 중복 재료 검증 ──────────────────────────
  const idSet = new Set();
  const duplicates = [];
  rawItems.forEach(i => {
    if (idSet.has(i.ingredient_id)) {
      const ing = ingredients.find(x => x.id === i.ingredient_id);
      duplicates.push(ing ? ing.name_ko : `ID ${i.ingredient_id}`);
    }
    idSet.add(i.ingredient_id);
  });
  if (duplicates.length) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_dup_ing')}: <b>${esc(duplicates.join(', '))}</b><br>${t('err_dup_ing_hint')}</div>`;
    return;
  }

  lockBtn('recipeSaveBtn');
  try {
    const resp = await apiFetch('/api/recipes', {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify({ menu_item: menu, menu_item_id, items: rawItems, menu_category })
    });
    const r = await resp.json();
    if (resp.ok && r.success) { closeModal('recipeModal'); loadRecipes(); }
    else msgEl.innerHTML = `<div class="alert alert-danger">${esc(r.error || t('err_save_net'))}</div>`;
  } catch (e) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_save_net')}</div>`;
  } finally {
    unlockBtn('recipeSaveBtn');
  }
}

async function delRecipe(menu) {
  if (!confirm(`"${menu}" ${t('confirm_del_recipe')}`)) return;
  try {
    const resp = await apiFetch(`/api/recipes/menu/${encodeURIComponent(menu)}`, { method: 'DELETE', headers: hdr() });
    const r = await resp.json().catch(() => ({}));
    if (!resp.ok || r.success === false) {
      alert(r.error || t('err_del'));
      return;
    }
    loadRecipes();
  } catch (e) {
    alert(t('err_del'));
  }
}

async function calcCost() {
  const menu = document.getElementById('costMenuSel').value;
  if (!menu) return;
  lockBtn('calcCostBtn', t('btn_calculating'));
  try {
    // ── 6. 항상 최신 데이터로 계산 ──
    const r = await apiFetch(`/api/cost/${encodeURIComponent(menu)}`, { headers: hdr() });
    const d = await r.json();
    const box = document.getElementById('costResult');
    box.classList.remove('hidden');
    box.innerHTML = '';

    const lbl = document.createElement('div');
    lbl.className = 'lbl';
    lbl.innerHTML = `${t('cost_menu_lbl')}: <b>${esc(d.menu_item)}</b>`;
    box.appendChild(lbl);

    d.items.forEach(i => {
      const line = document.createElement('div');
      line.style.cssText = 'font-size:.85rem;color:var(--mid);margin:.2rem 0';
      const unitCost = i.capacity_ml > 0 ? i.cost_per_unit / i.capacity_ml : i.cost_per_unit;
      line.textContent = `• ${i.name_ko}: ${i.quantity}${i.unit} × ${unitCost.toFixed(2)} = ${Math.round(i.quantity * unitCost).toLocaleString()} IQD`;
      box.appendChild(line);
    });

    const total = document.createElement('div');
    total.className = 'total';
    total.style.marginTop = '.5rem';
    total.textContent = `${t('cost_total_lbl')}: ${d.total_cost.toLocaleString()} IQD`;
    box.appendChild(total);
  } catch (e) {
    document.getElementById('costResult').classList.remove('hidden');
    document.getElementById('costResult').innerHTML = `<div class="alert alert-danger">${t('err_calc')}</div>`;
  } finally {
    unlockBtn('calcCostBtn');
  }
}

// ══════════════════════════════════════════════
// 입출고
// ══════════════════════════════════════════════
function loadAdjust() {
  const sel = document.getElementById('adjIng');
  sel.innerHTML = `<option value="">${t('opt_select')}</option>`;
  ingredients.forEach(i => {
    const opt = document.createElement('option');
    opt.value = i.id;
    opt.textContent = `${i.name_ko} (${t('adj_current')}: ${i.current_qty}${i.unit})`;
    sel.appendChild(opt);
  });
}

async function submitAdjust() {
  const ingredient_id = parseInt(document.getElementById('adjIng').value);
  const change_type = document.getElementById('adjType').value;
  const quantity = parseFloat(document.getElementById('adjQty').value);
  const reason = document.getElementById('adjReason').value.trim();
  const msgEl = document.getElementById('adjMsg');

  if (!ingredient_id || !quantity || quantity <= 0) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_adj_input')}</div>`;
    return;
  }
  if (quantity > 9999) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_qty_range')}</div>`;
    return;
  }
  lockBtn('adjBtn');
  try {
    const res = await apiFetch('/api/inventory/adjust', {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify({ ingredient_id, change_type, quantity, reason })
    });
    const r = await res.json();

    if (r.success) {
      msgEl.innerHTML = `<div class="alert alert-success">✅ ${t('adj_success')}: <b>${esc(String(r.new_qty))}</b></div>`;
      document.getElementById('adjQty').value = '';
      document.getElementById('adjReason').value = '';
      await loadIngredients(false);
      loadAdjust();
    } else {
      msgEl.innerHTML = `<div class="alert alert-danger">❌ ${esc(r.error)}</div>`;
    }
  } catch (e) {
    if (e.message !== 'unauthorized') {
      msgEl.innerHTML = `<div class="alert alert-danger">${t('err_network')}</div>`;
    }
  } finally {
    unlockBtn('adjBtn');
  }
}

// ══════════════════════════════════════════════
// 사이즈 레시피 관리
// ══════════════════════════════════════════════
async function loadSizeRecipes() {
  try {
    const resp = await apiFetch('/api/size-recipes', { headers: hdr() });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    sizeRecipes = await resp.json();

    const tb = document.getElementById('sizeRecipeTb');
    if (!tb) return;
    tb.innerHTML = '';
    if (!sizeRecipes.length) {
      tb.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--soft);padding:1.5rem">${t('size_recipe_empty')}</td></tr>`;
      return;
    }
    // 메뉴별로 그룹핑
    const grouped = {};
    sizeRecipes.forEach(sr => {
      if (!grouped[sr.menu_item]) grouped[sr.menu_item] = [];
      grouped[sr.menu_item].push(sr);
    });
    Object.entries(grouped).forEach(([menuName, rows]) => {
      const ingSummary = rows.map(r =>
        `${esc(r.name_ko || r.name_ar || '')} <span style="font-size:.72rem;color:var(--soft)">(S:${r.s_qty} M:${r.m_qty} L:${r.l_qty})</span>`
      ).join('<br>');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${esc(menuName)}</b></td>
        <td style="font-size:.82rem;line-height:1.6">${ingSummary}</td>
        <td>
          <div style="display:flex;gap:.3rem;justify-content:center">
            <button class="btn btn-outline btn-sm" onclick="openSizeRecipeModal(${JSON.stringify(menuName).replace(/"/g,'&quot;')})">${t('btn_edit')}</button>
            <button class="btn btn-danger btn-sm" onclick="delSizeRecipe(${JSON.stringify(menuName).replace(/"/g,'&quot;')})">${t('btn_delete')}</button>
          </div>
        </td>
      `;
      tb.appendChild(tr);
    });
  } catch (e) {
    const tb = document.getElementById('sizeRecipeTb');
    if (tb) tb.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--red);padding:1.5rem">${t('err_load')}</td></tr>`;
  }
}

function openSizeRecipeModal(existingMenuName) {
  document.getElementById('srModalMsg').innerHTML = '';
  document.getElementById('srIngTable').style.display = 'none';
  document.getElementById('srIngRows').innerHTML = '';

  // 레시피 드롭다운 채우기 (unique menu names)
  const sel = document.getElementById('srRecipeSelect');
  const menuNames = [...new Set(recipes.map(r => r.menu_item))].sort();
  sel.innerHTML = `<option value="">— ${t('opt_select')} —</option>`;
  menuNames.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (existingMenuName && name === existingMenuName) opt.selected = true;
    sel.appendChild(opt);
  });

  document.getElementById('srOrigMenu').value = existingMenuName || '';
  document.getElementById('sizeRecipeModal').classList.remove('hidden');

  if (existingMenuName) onSrRecipeChange();
}

function onSrRecipeChange() {
  const menuName = document.getElementById('srRecipeSelect').value;
  const tableEl  = document.getElementById('srIngTable');
  const rowsEl   = document.getElementById('srIngRows');
  rowsEl.innerHTML = '';

  if (!menuName) { tableEl.style.display = 'none'; return; }

  // 이 메뉴의 레시피 재료 목록
  const menuIngredients = recipes.filter(r => r.menu_item === menuName);
  if (!menuIngredients.length) { tableEl.style.display = 'none'; return; }

  // 기존에 저장된 사이즈 레시피 값 (있으면 미리 채우기)
  const existing = {};
  sizeRecipes.filter(sr => sr.menu_item === menuName).forEach(sr => {
    existing[sr.ingredient_id] = sr;
  });

  menuIngredients.forEach(ing => {
    const ex = existing[ing.ingredient_id] || {};
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr 70px 70px 70px;gap:.4rem;align-items:center;margin-bottom:.4rem';
    row.innerHTML = `
      <span style="font-size:.82rem;font-weight:600">${esc(ing.name_ko)}${ing.name_ar ? `<br><span style="font-size:.72rem;color:var(--soft)">${esc(ing.name_ar)}</span>` : ''}</span>
      <input type="number" min="0" step="0.1" placeholder="g"
        style="text-align:center;padding:.3rem .25rem;font-size:.82rem"
        data-ing-id="${ing.ingredient_id}" data-size="s"
        value="${ex.s_qty != null ? ex.s_qty : ''}">
      <input type="number" min="0" step="0.1" placeholder="g"
        style="text-align:center;padding:.3rem .25rem;font-size:.82rem"
        data-ing-id="${ing.ingredient_id}" data-size="m"
        value="${ex.m_qty != null ? ex.m_qty : (ing.quantity != null ? ing.quantity : '')}">
      <input type="number" min="0" step="0.1" placeholder="g"
        style="text-align:center;padding:.3rem .25rem;font-size:.82rem"
        data-ing-id="${ing.ingredient_id}" data-size="l"
        value="${ex.l_qty != null ? ex.l_qty : ''}">
    `;
    rowsEl.appendChild(row);
  });

  tableEl.style.display = 'block';
}

async function saveSizeRecipe() {
  const menuName = document.getElementById('srRecipeSelect').value.trim();
  const msgEl    = document.getElementById('srModalMsg');

  if (!menuName) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_size_menu')}</div>`; return;
  }

  // 재료별 S/M/L 수집
  const inputs = document.querySelectorAll('#srIngRows input[data-ing-id]');
  const itemMap = {};
  inputs.forEach(inp => {
    const id   = parseInt(inp.dataset.ingId);
    const size = inp.dataset.size;
    if (!itemMap[id]) itemMap[id] = { ingredient_id: id };
    itemMap[id][`${size}_qty`] = parseFloat(inp.value) || 0;
  });
  const items = Object.values(itemMap);

  if (!items.length) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_size_ing')}</div>`; return;
  }
  for (const it of items) {
    if (it.s_qty < 0 || it.m_qty < 0 || it.l_qty < 0) {
      msgEl.innerHTML = `<div class="alert alert-danger">${t('err_size_qty')}</div>`; return;
    }
  }

  // menu_category는 레시피에서 가져옴
  const recipeRow = recipes.find(r => r.menu_item === menuName);
  const menu_category = recipeRow?.menu_category || '음료';

  lockBtn('srSaveBtn');
  try {
    const res = await apiFetch('/api/size-recipes', {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify({ menu_item: menuName, menu_category, items })
    });
    const r = await res.json();
    if (r.success) {
      closeModal('sizeRecipeModal');
      await loadSizeRecipes();
      renderSizeSalesGrid();
    } else {
      msgEl.innerHTML = `<div class="alert alert-danger">${esc(r.error)}</div>`;
    }
  } catch (e) {
    if (e.message !== 'unauthorized') msgEl.innerHTML = `<div class="alert alert-danger">${t('err_network')}</div>`;
  } finally {
    unlockBtn('srSaveBtn');
  }
}

async function delSizeRecipe(menuItem) {
  if (!confirm(t('confirm_del_size_recipe'))) return;
  try {
    await apiFetch(`/api/size-recipes/menu/${encodeURIComponent(menuItem)}`, { method: 'DELETE', headers: hdr() });
    await loadSizeRecipes();
    renderSizeSalesGrid();
  } catch (e) { /* silent */ }
}

// ══════════════════════════════════════════════
// 사이즈 판매 그리드
// ══════════════════════════════════════════════
function renderSizeSalesGrid() {
  const grid = document.getElementById('sizeSalesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!sizeRecipes.length) {
    grid.innerHTML = `<p style="color:var(--soft);font-size:.85rem">${t('size_sales_empty')}</p>`;
    return;
  }

  // 헤더
  const header = document.createElement('div');
  header.style.cssText = 'display:grid;grid-template-columns:1fr 80px 80px 80px;gap:.4rem;align-items:center;font-size:.78rem;font-weight:800;color:var(--soft);margin-bottom:.3rem;padding:0 .25rem';
  header.innerHTML = `<span>${t('col_menu')}</span><span style="text-align:center">S</span><span style="text-align:center">M</span><span style="text-align:center">L</span>`;
  grid.appendChild(header);

  sizeRecipes.forEach(sr => {
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr 80px 80px 80px;gap:.4rem;align-items:center;margin-bottom:.35rem';
    row.innerHTML = `
      <span style="font-weight:700;font-size:.9rem">${esc(sr.menu_item)}</span>
      <input type="number" class="sr-s-input" data-menu="${esc(sr.menu_item)}" min="0" max="9999" step="1" placeholder="0"
        style="padding:.4rem .3rem;border:2px solid #e2e8f0;border-radius:8px;font-size:.9rem;font-weight:700;text-align:center;font-family:inherit;width:100%">
      <input type="number" class="sr-m-input" data-menu="${esc(sr.menu_item)}" min="0" max="9999" step="1" placeholder="0"
        style="padding:.4rem .3rem;border:2px solid #e2e8f0;border-radius:8px;font-size:.9rem;font-weight:700;text-align:center;font-family:inherit;width:100%">
      <input type="number" class="sr-l-input" data-menu="${esc(sr.menu_item)}" min="0" max="9999" step="1" placeholder="0"
        style="padding:.4rem .3rem;border:2px solid #e2e8f0;border-radius:8px;font-size:.9rem;font-weight:700;text-align:center;font-family:inherit;width:100%">
    `;
    grid.appendChild(row);
  });
}

async function submitSizeSales() {
  const date  = document.getElementById('saleDate').value;
  const msgEl = document.getElementById('sizeSaleMsg');

  if (!date) { msgEl.innerHTML = `<div class="alert alert-danger">${t('err_no_date')}</div>`; return; }

  const sales = [];
  document.querySelectorAll('#sizeSalesGrid [data-menu]').forEach(input => {
    if (input.classList.contains('sr-s-input')) {
      const menu = input.dataset.menu;
      const s = parseInt(input.value) || 0;
      const mEl = input.parentElement.querySelector('.sr-m-input');
      const lEl = input.parentElement.querySelector('.sr-l-input');
      const m = parseInt(mEl?.value) || 0;
      const l = parseInt(lEl?.value) || 0;
      if (s > 0 || m > 0 || l > 0) {
        sales.push({ menu_item: menu, s_count: s, m_count: m, l_count: l });
      }
    }
  });

  if (!sales.length) { msgEl.innerHTML = `<div class="alert alert-warn">${t('err_no_size_sales')}</div>`; return; }

  lockBtn('sizeSaleBtn');
  try {
    const res = await apiFetch('/api/size-sales', {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify({ sale_date: date, sales })
    });
    const r = await res.json();
    if (r.success) {
      let html = `<div class="alert alert-success">✅ ${sales.length}${t('size_sales_success')}</div>`;
      if (r.warnings?.length) {
        html += r.warnings.map(w => `<div class="alert alert-warn">⚠️ ${esc(w)}</div>`).join('');
      }
      msgEl.innerHTML = html;
      renderSizeSalesGrid();
      await loadIngredients(false);
    } else {
      msgEl.innerHTML = `<div class="alert alert-danger">❌ ${esc(r.error)}</div>`;
    }
  } catch (e) {
    if (e.message !== 'unauthorized') msgEl.innerHTML = `<div class="alert alert-danger">${t('err_network')}</div>`;
  } finally {
    unlockBtn('sizeSaleBtn');
  }
}

// ══════════════════════════════════════════════
// 일일 판매 — 수동 메뉴 입력
// ══════════════════════════════════════════════
function loadDaily() {
  if (!document.getElementById('saleDate').value) {
    document.getElementById('saleDate').value = localDateStr();
  }
  if (!document.getElementById('saleRows').children.length) {
    addSaleRow();
  }
  // 사이즈 레시피 로드 후 판매 그리드 렌더
  loadSizeRecipes().then(() => renderSizeSalesGrid());
  // Auto-preview pending web orders for the selected date
  if (typeof loadWebSettlePreview === 'function') loadWebSettlePreview();
}

// ── Web Orders Daily Settlement ──
async function loadWebSettlePreview() {
  const previewEl = document.getElementById('webSettlePreview');
  const btn = document.getElementById('webSettleBtn');
  if (!previewEl || !btn) return;
  const date = document.getElementById('saleDate').value || '';
  previewEl.textContent = 'Loading…';
  btn.disabled = true;
  try {
    const url = date
      ? '/api/inventory/pending-settlement?date=' + encodeURIComponent(date)
      : '/api/inventory/pending-settlement';
    const resp = await apiFetch(url, { headers: hdr() });
    if (!resp.ok) throw new Error('Failed to load preview');
    const data = await resp.json();
    if (data.count === 0) {
      previewEl.innerHTML = 'No pending web orders for this date.';
      btn.disabled = true;
    } else {
      const rev = Number(data.total_revenue || 0).toLocaleString();
      previewEl.innerHTML = '<strong>' + data.count + '</strong> pending order(s) · Revenue: <strong>' + rev + ' IQD</strong>';
      btn.disabled = false;
    }
  } catch (e) {
    previewEl.innerHTML = '<span style="color:#c43">Failed to load preview.</span>';
    btn.disabled = true;
  }
}

async function runDailySettle() {
  const msgEl = document.getElementById('webSettleMsg');
  const btn = document.getElementById('webSettleBtn');
  if (!msgEl || !btn) return;
  if (!confirm('Settle all pending web orders and deduct stock now?')) return;
  const date = document.getElementById('saleDate').value || '';
  btn.disabled = true;
  msgEl.textContent = '';
  try {
    const resp = await apiFetch('/api/inventory/daily-settle', {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify(date ? { date: date } : {})
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Settlement failed');
    msgEl.innerHTML = '<span style="color:#2d7a3d">✅ Settled ' + data.processed + ' order(s) · ' + data.ingredient_count + ' ingredient(s) updated.</span>';
    loadWebSettlePreview();
    if (typeof loadIngredients === 'function') loadIngredients(false);
  } catch (e) {
    msgEl.innerHTML = '<span style="color:#c43">❌ ' + (e && e.message ? e.message : 'Failed') + '</span>';
    btn.disabled = false;
  }
}

function addSaleRow() {
  const container = document.getElementById('saleRows');
  const listId = 'saleMenuList';

  // datalist 없으면 생성
  if (!document.getElementById(listId)) {
    const dl = document.createElement('datalist');
    dl.id = listId;
    document.body.appendChild(dl);
  }
  // recipes에서 메뉴명 목록 채우기
  const dl = document.getElementById(listId);
  const menuNames = [...new Set(recipes.map(r => r.menu_item))];
  dl.innerHTML = menuNames.map(m => `<option value="${esc(m)}">`).join('');

  const row = document.createElement('div');
  row.className = 'sale-row';
  row.style.cssText = 'display:flex;gap:.5rem;align-items:center';
  row.innerHTML = `
    <input type="text" class="sale-menu" list="${listId}" placeholder="${t('ph_sale_menu')}" style="flex:1;padding:.45rem .6rem;border:2px solid #e2e8f0;border-radius:8px;font-size:.9rem;font-family:inherit" autocomplete="off">
    <input type="number" class="sale-qty" min="1" max="9999" step="1" placeholder="0" style="width:80px;padding:.45rem .5rem;border:2px solid #e2e8f0;border-radius:8px;font-size:.9rem;font-weight:700;text-align:center;font-family:inherit">
    <button class="btn btn-sm" style="padding:.35rem .6rem;background:var(--red);color:#fff;border-radius:6px;flex-shrink:0" onclick="this.closest('.sale-row').remove()">✕</button>
  `;
  container.appendChild(row);
  row.querySelector('.sale-menu').focus();
}

async function submitSales() {
  const date = document.getElementById('saleDate').value;
  const msgEl = document.getElementById('saleMsg');

  if (!date) { msgEl.innerHTML = `<div class="alert alert-danger">${t('err_no_date')}</div>`; return; }

  const rows = [...document.querySelectorAll('#saleRows .sale-row')];
  const sales = rows
    .map(row => ({
      menu_item: row.querySelector('.sale-menu').value.trim(),
      quantity: parseInt(row.querySelector('.sale-qty').value)
    }))
    .filter(s => s.menu_item && s.quantity > 0);

  if (!sales.length) { msgEl.innerHTML = `<div class="alert alert-warn">${t('err_no_sale_rows')}</div>`; return; }

  const outOfRange = sales.some(s => s.quantity < 1 || s.quantity > 9999);
  if (outOfRange) { msgEl.innerHTML = `<div class="alert alert-danger">${t('err_qty_range')}</div>`; return; }

  lockBtn('saleBtn');
  try {
    const res = await apiFetch('/api/daily-sales', {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify({ sale_date: date, sales })
    });
    const r = await res.json();

    if (r.success) {
      let html = `<div class="alert alert-success">✅ ${sales.length}${t('sales_success')}</div>`;
      if (r.warnings?.length) {
        html += r.warnings.map(w => `<div class="alert alert-warn">⚠️ ${esc(w)}</div>`).join('');
      }
      msgEl.innerHTML = html;
      document.getElementById('saleRows').innerHTML = '';
      addSaleRow();
      await loadIngredients(false);
    } else {
      msgEl.innerHTML = `<div class="alert alert-danger">❌ ${esc(r.error)}</div>`;
    }
  } catch (e) {
    if (e.message !== 'unauthorized') {
      msgEl.innerHTML = `<div class="alert alert-danger">${t('err_network')}</div>`;
    }
  } finally {
    unlockBtn('saleBtn');
  }
}

// ══════════════════════════════════════════════
// 기록
// ══════════════════════════════════════════════
async function loadHistory() {
  try {
    const resp = await apiFetch('/api/inventory/history?limit=200', { headers: hdr() });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const d = await resp.json();
    _histCache = d;
    const tb = document.getElementById('histTb');
    tb.innerHTML = '';
    if (!d.length) {
      tb.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--soft);padding:1.5rem">${t('hist_empty')}</td></tr>`;
      return;
    }
    d.forEach(h => tb.appendChild(buildHistRow(h, true)));
  } catch (e) {
    document.getElementById('histTb').innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--red);padding:1.5rem">${t('err_load')}</td></tr>`;
  }
}

function exportHistoryCSV() {
  if (!_histCache.length) { alert(t('export_empty')); return; }
  const escape = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const header = [t('csv_col_name'), t('csv_col_type'), t('csv_col_qty'), t('csv_col_reason'), t('csv_col_dt')].join(',');
  const rows = _histCache.map(h => {
    const type = h.change_type === 'in' ? t('csv_type_in') : t('csv_type_out');
    const dt = new Date(h.created_at + (h.created_at.includes('Z') ? '' : 'Z'))
      .toLocaleString('en-GB', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
    return [h.ingredient_name, type, h.quantity, h.reason || '', dt].map(escape).join(',');
  });
  const csv = '\uFEFF' + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${t('csv_filename')}_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function openHistEditModal(id) {
  const h = _histCache.find(r => r.id === id);
  if (!h) return;
  document.getElementById('histEditId').value = id;
  document.getElementById('histEditIngName').value = h.ingredient_name;
  document.getElementById('histEditType').value = h.change_type;
  document.getElementById('histEditQty').value = h.quantity;
  document.getElementById('histEditReason').value = h.reason || '';
  document.getElementById('histEditMsg').innerHTML = '';
  document.getElementById('histEditModal').classList.remove('hidden');
}

async function deleteHistEntry(id) {
  if (!confirm(t('confirm_del_hist'))) return;
  try {
    const r = await apiFetch(`/api/inventory/history/${id}`, { method: 'DELETE', headers: hdr() });
    if (!r.ok) throw new Error();
    await loadHistory();
    await loadDashboard();
  } catch {
    alert(t('hist_del_fail'));
  }
}

async function saveHistEdit() {
  const id = parseInt(document.getElementById('histEditId').value, 10);
  const change_type = document.getElementById('histEditType').value;
  const quantity = parseFloat(document.getElementById('histEditQty').value);
  const reason = document.getElementById('histEditReason').value.trim();
  const msgEl = document.getElementById('histEditMsg');

  if (!Number.isInteger(id) || id <= 0) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_hist_save')}</div>`; return;
  }
  if (!['in', 'out'].includes(change_type)) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_hist_type')}</div>`; return;
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_hist_qty')}</div>`; return;
  }

  lockBtn('histEditSaveBtn');
  try {
    const r = await apiFetch(`/api/inventory/history/${id}`, {
      method: 'PUT',
      headers: hdr(),
      body: JSON.stringify({ change_type, quantity, reason })
    });
    if (!r.ok) throw new Error();
    closeModal('histEditModal');
    await loadHistory();
    await loadDashboard();
  } catch {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('err_hist_save')}</div>`;
  } finally {
    unlockBtn('histEditSaveBtn');
  }
}

// ══════════════════════════════════════════════
// 설정
// ══════════════════════════════════════════════
async function changePw() {
  const pw = document.getElementById('newPw').value;
  const pw2 = document.getElementById('newPw2').value;
  const msgEl = document.getElementById('pwMsg');

  if (pw !== pw2) { msgEl.innerHTML = `<div class="alert alert-danger">${t('err_pw_mismatch')}</div>`; return; }
  if (pw.length < 4) { msgEl.innerHTML = `<div class="alert alert-danger">${t('err_pw_short')}</div>`; return; }

  lockBtn('pwBtn');
  try {
    const resp = await apiFetch('/api/auth/change-password', {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify({ newPassword: pw })
    });
    const r = await resp.json().catch(() => ({}));
    if (resp.ok && r.success) {
      msgEl.innerHTML = `<div class="alert alert-success">${t('pw_success')}</div>`;
      document.getElementById('newPw').value = '';
      document.getElementById('newPw2').value = '';
    } else {
      msgEl.innerHTML = `<div class="alert alert-danger">${esc(r.error)}</div>`;
    }
  } catch (e) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('pw_change_fail')}</div>`;
  } finally {
    unlockBtn('pwBtn');
  }
}

// ══════════════════════════════════════════════
// 캐셔 관리
// ══════════════════════════════════════════════
async function loadCashiers() {
  const listEl = document.getElementById('cashier-list');
  if (!listEl) return;
  try {
    const cashiersResp = await apiFetch('/api/cashiers', { headers: hdr() });
    if (!cashiersResp.ok) throw new Error(`HTTP ${cashiersResp.status}`);
    const data = await cashiersResp.json();
    if (!data.length) {
      listEl.innerHTML = `<p style="color:var(--soft);font-size:.9em">${t('cashier_empty')}</p>`;
      return;
    }
    listEl.innerHTML = data.map(c => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border);">
        <span>${c.role==='manager'?'🔑':'👤'} <strong>${esc(c.name)}</strong> <small style="color:var(--soft);font-size:.78em;margin-left:.4rem">${c.role==='manager'?t('role_manager')||'Manager':'Cashier'}</small></span>
        <button class="btn btn-danger js-del-cashier" data-id="${c.id}" data-name="${esc(c.name)}" style="padding:4px 10px;font-size:.8em">${t('btn_delete')}</button>
      </div>`).join('');
    listEl.querySelectorAll('.js-del-cashier').forEach(btn => {
      btn.addEventListener('click', () => deleteCashier(parseInt(btn.dataset.id, 10), btn.dataset.name));
    });
  } catch (e) {
    listEl.innerHTML = `<p style="color:var(--red);font-size:.9em">${t('err_load')}</p>`;
  }
}

async function addCashier() {
  const name = document.getElementById('newCashierName').value.trim();
  const pw = document.getElementById('newCashierPw').value;
  const role = document.getElementById('newCashierRole').value;
  const msgEl = document.getElementById('cashierMsg');
  if (!name) { msgEl.innerHTML = `<div class="alert alert-danger">${t('err_cashier_name')}</div>`; return; }
  if (pw.length < 4) { msgEl.innerHTML = `<div class="alert alert-danger">${t('err_cashier_pw')}</div>`; return; }
  try {
    const resp = await apiFetch('/api/cashiers', {
      method: 'POST',
      headers: { ...hdr(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password: pw, role })
    });
    const r = await resp.json().catch(() => ({}));
    if (resp.ok && r.success) {
      msgEl.innerHTML = `<div class="alert alert-success">${t('cashier_added')}</div>`;
      document.getElementById('newCashierName').value = '';
      document.getElementById('newCashierPw').value = '';
      document.getElementById('newCashierRole').value = 'cashier';
      loadCashiers();
    } else {
      msgEl.innerHTML = `<div class="alert alert-danger">${esc(r.error||t('cashier_add_fail'))}</div>`;
    }
  } catch (e) {
    msgEl.innerHTML = `<div class="alert alert-danger">${t('cashier_add_net')}</div>`;
  }
}

async function deleteCashier(id, name) {
  if (!Number.isInteger(id) || id <= 0) return;
  if (!confirm(`"${name}" ${t('confirm_del_cashier')}`)) return;
  try {
    const resp = await apiFetch(`/api/cashiers/${id}`, { method: 'DELETE', headers: hdr() });
    const r = await resp.json().catch(() => ({}));
    if (resp.ok && r.success) loadCashiers();
    else alert(r.error || t('err_del'));
  } catch (e) {
    alert(t('err_del'));
  }
}

// ══════════════════════════════════════════════
// 재고 부족 뱃지
// ══════════════════════════════════════════════
function updateLowStockBadge(count) {
  const navBtns = document.querySelectorAll('#mainNav button');
  navBtns.forEach(btn => {
    const old = btn.querySelector('.nav-badge');
    if (old) old.remove();
  });
  if (count > 0) {
    const dashBtn = document.querySelector('#mainNav button[onclick*="dashboard"]');
    if (dashBtn) {
      const badge = document.createElement('span');
      badge.className = 'nav-badge';
      badge.textContent = count;
      dashBtn.appendChild(badge);
    }
  }
}

// ══════════════════════════════════════════════
// 예산 트래커
// ══════════════════════════════════════════════
function getBudget() {
  return parseInt(localStorage.getItem('wh_monthly_budget') || '0', 10);
}
function openBudgetModal() {
  document.getElementById('budgetInput').value = getBudget() || '';
  document.getElementById('budgetModalCard').classList.remove('hidden');
}
function closeBudgetModal() {
  document.getElementById('budgetModalCard').classList.add('hidden');
}
function saveBudget() {
  const v = parseInt(document.getElementById('budgetInput').value, 10);
  if (!isNaN(v) && v >= 0) {
    localStorage.setItem('wh_monthly_budget', v);
    closeBudgetModal();
    loadBudgetTracker();
  }
}

async function loadBudgetTracker() {
  const body = document.getElementById('budgetTrackerBody');
  if (!body) return;
  const goal = getBudget();

  try {
    // 이번 달 입고 기록만 집계
    const histResp = await apiFetch('/api/inventory/history?limit=2000', { headers: hdr() });
    if (!histResp.ok) throw new Error(`HTTP ${histResp.status}`);
    const hist = await histResp.json();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const ingById = new Map(ingredients.map(i => [i.id, i]));

    let spent = 0;
    hist.forEach(h => {
      if (h.change_type !== 'in') return;
      const d = new Date(h.created_at + (h.created_at.includes('Z') ? '' : 'Z'));
      if (d < monthStart) return;
      // 재료 단위 원가 찾기 (ID 우선, 이름은 폴백)
      let ing = h.ingredient_id ? ingById.get(h.ingredient_id) : null;
      if (!ing) ing = ingredients.find(i => i.name_ko === h.ingredient_name || i.name_ar === h.ingredient_name);
      if (ing && ing.cost_per_unit) {
        const unitCost = ing.capacity_ml > 0 ? ing.cost_per_unit / ing.capacity_ml : ing.cost_per_unit;
        spent += h.quantity * unitCost;
      }
    });

    if (!goal) {
      body.innerHTML = `<p style="color:var(--soft);margin:0">${t('budget_no_goal')}</p>`;
      return;
    }

    const pct = Math.min(100, (spent / goal) * 100);
    const remaining = goal - spent;
    const colorClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : '';

    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:.35rem">
        <span style="font-size:.82rem;color:var(--soft)">${t('budget_spent')}: <b style="color:var(--dark)">${Math.round(spent).toLocaleString()} IQD</b></span>
        <span style="font-size:.82rem;color:var(--soft)">${t('budget_goal')}: <b>${Math.round(goal).toLocaleString()} IQD</b></span>
      </div>
      <div class="budget-bar-bg">
        <div class="budget-bar-fill ${colorClass}" style="width:${pct.toFixed(1)}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:.35rem">
        <span style="font-size:.8rem;font-weight:700;color:${pct>=90?'var(--red)':pct>=70?'var(--orange)':'var(--green)'}">${pct.toFixed(1)}% ${t('budget_spent').split(' ')[0]}</span>
        <span style="font-size:.8rem;color:var(--soft)">${t('budget_remaining')}: <b>${Math.max(0, Math.round(remaining)).toLocaleString()} IQD</b></span>
      </div>
    `;
  } catch (e) {
    body.innerHTML = `<p style="color:var(--soft);margin:0">${t('budget_no_goal')}</p>`;
  }
}

// ══════════════════════════════════════════════
// 공급업체 관리 (server API)
// ══════════════════════════════════════════════
let SUPPLIERS_CACHE = [];

async function fetchSuppliers() {
  try {
    const r = await fetch('/api/suppliers', { headers: hdr() });
    if (!r.ok) throw new Error('load failed');
    SUPPLIERS_CACHE = await r.json();
  } catch (_) {
    SUPPLIERS_CACHE = [];
  }
  return SUPPLIERS_CACHE;
}

function syncSupplierDatalist() {
  const sel = document.getElementById('ingSupplierId');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = `<option value="">${t('opt_no_supplier')}</option>`;
  SUPPLIERS_CACHE.forEach(s => {
    const opt = document.createElement('option');
    opt.value = String(s.id);
    opt.textContent = s.name + (s.phone ? `  ·  ${s.phone}` : '');
    sel.appendChild(opt);
  });
  if (current) sel.value = current;
}

async function loadSuppliers() {
  await fetchSuppliers();
  syncSupplierDatalist();
  const list = document.getElementById('supplierList');
  if (!list) return;
  if (!SUPPLIERS_CACHE.length) {
    list.innerHTML = `<p style="color:var(--soft);margin:0;font-size:.85rem">${t('supplier_empty')}</p>`;
    return;
  }
  list.innerHTML = '';
  SUPPLIERS_CACHE.forEach(s => {
    const card = document.createElement('div');
    card.className = 'supplier-card';
    card.innerHTML = `
      <div>
        <div class="sup-name">${esc(s.name)}</div>
        ${s.contact_person ? `<div class="sup-detail">👤 ${esc(s.contact_person)}</div>` : ''}
        ${s.phone ? `<div class="sup-detail">📞 ${esc(s.phone)}</div>` : ''}
        ${s.whatsapp ? `<div class="sup-detail">💬 ${esc(s.whatsapp)}</div>` : ''}
        ${s.address ? `<div class="sup-detail">📍 ${esc(s.address)}</div>` : ''}
        ${s.note ? `<div class="sup-detail">📝 ${esc(s.note)}</div>` : ''}
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteSupplier(${s.id})" style="flex-shrink:0">${t('btn_delete')}</button>
    `;
    list.appendChild(card);
  });
}

async function addSupplier() {
  const name = document.getElementById('supName').value.trim();
  if (!name) { alert(t('err_sup_name')); return; }
  const payload = {
    name,
    contact_person: document.getElementById('supContactPerson').value.trim(),
    phone: document.getElementById('supPhone').value.trim(),
    whatsapp: document.getElementById('supWhatsapp').value.trim(),
    address: document.getElementById('supAddress').value.trim(),
    note: document.getElementById('supNote').value.trim(),
  };
  try {
    const r = await fetch('/api/suppliers', { method: 'POST', headers: hdr(), body: JSON.stringify(payload) });
    const data = await r.json();
    if (!r.ok) { alert(data.error || 'failed'); return; }
    ['supName','supContactPerson','supPhone','supWhatsapp','supAddress','supNote'].forEach(id => { document.getElementById(id).value = ''; });
    await loadSuppliers();
  } catch (_) {
    alert(t('err_network') || 'Network error');
  }
}

async function deleteSupplier(id) {
  if (!confirm(t('confirm_del_supplier'))) return;
  try {
    const r = await fetch('/api/suppliers/' + id, { method: 'DELETE', headers: hdr() });
    if (!r.ok) { const d = await r.json().catch(()=>({})); alert(d.error || 'failed'); return; }
    await loadSuppliers();
  } catch (_) {
    alert(t('err_network') || 'Network error');
  }
}

// ══════════════════════════════════════════════
// 재고 모달 헬퍼: 박스 자동 계산 + 이미지 미리보기
// ══════════════════════════════════════════════
function recomputeTotalQty() {
  const qpb = parseFloat(document.getElementById('ingQtyPerBox').value);
  const nb  = parseFloat(document.getElementById('ingNumBoxes').value);
  const cur = document.getElementById('ingCurQty');
  const hint = document.getElementById('ingCurQtyHint');
  if (Number.isFinite(qpb) && qpb > 0 && Number.isFinite(nb) && nb > 0) {
    cur.value = (qpb * nb).toFixed(2).replace(/\.?0+$/, '');
    cur.readOnly = true;
    if (hint) hint.style.display = 'block';
  } else {
    cur.readOnly = false;
    if (hint) hint.style.display = 'none';
  }
}

function previewIngImage(ev) {
  const file = ev.target.files && ev.target.files[0];
  const wrap = document.getElementById('ingImagePreviewWrap');
  const img = document.getElementById('ingImagePreview');
  if (!file) { wrap.style.display = 'none'; img.src = ''; return; }
  if (file.size > 5 * 1024 * 1024) {
    alert(t('err_image_size') || 'Image must be ≤ 5MB');
    ev.target.value = '';
    wrap.style.display = 'none';
    return;
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    alert(t('err_image_type') || 'Only jpg / png / webp allowed');
    ev.target.value = '';
    wrap.style.display = 'none';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => { img.src = e.target.result; wrap.style.display = 'block'; };
  reader.readAsDataURL(file);
}

function clearIngImage() {
  document.getElementById('ingImageFile').value = '';
  document.getElementById('ingImagePath').value = '';
  document.getElementById('ingImagePreview').src = '';
  document.getElementById('ingImagePreviewWrap').style.display = 'none';
}

function openImageZoom(src) {
  if (!src) return;
  document.getElementById('imageZoomImg').src = src;
  document.getElementById('imageZoomModal').classList.remove('hidden');
}
function closeImageZoom(ev) {
  if (ev && ev.target && ev.target.id === 'imageZoomImg') return;
  document.getElementById('imageZoomModal').classList.add('hidden');
  document.getElementById('imageZoomImg').src = '';
}

// ══════════════════════════════════════════════
// 전체 메뉴 원가 요약
// ══════════════════════════════════════════════
let _cachedGrouped = {};

async function loadAllCosts(grouped) {
  _cachedGrouped = grouped;
  const grid = document.getElementById('allCostGrid');
  if (!grid) return;
  const menus = Object.keys(grouped);
  if (!menus.length) {
    grid.innerHTML = `<p style="color:var(--soft)">${t('all_cost_empty')}</p>`;
    return;
  }

  // 판매가 fetch
  let priceMap = {};
  try {
    const resp = await apiFetch('/api/menu-prices', { headers: hdr() });
    if (resp.ok) {
      const rows = await resp.json();
      rows.forEach(r => { priceMap[r.menu_item] = r.selling_price; });
    }
  } catch (e) { console.warn('[wh-menu-prices] fetch failed, prices will be blank', e); }

  grid.innerHTML = '';
  menus.forEach(menu => {
    const items = grouped[menu];
    const totalCost = Math.round(items.reduce((s, i) => {
      const unitCost = i.capacity_ml > 0 ? i.cost_per_unit / i.capacity_ml : i.cost_per_unit;
      return s + i.quantity * unitCost;
    }, 0));
    const sellingPrice = priceMap[menu] || 0;
    const rate = sellingPrice > 0 ? ((totalCost / sellingPrice) * 100).toFixed(1) : null;
    const rateNum = rate !== null ? parseFloat(rate) : 0;
    // 카페 업계 통상: 25-35% 양호 / 35-50% 주의 / >50% 위험 / >100% 손실
    const rateColor = rateNum > 100 ? '#c0392b'
                    : rateNum > 50  ? 'var(--danger)'
                    : rateNum > 35  ? 'var(--orange, #f59e0b)'
                                    : 'var(--green)';
    const rateHtml = rate !== null
      ? `<div class="menu-rate" style="font-size:.8rem;margin-top:.25rem;color:${rateColor}">cost ${esc(rate)}%${rateNum > 100 ? ' ⚠️ LOSS' : ''}</div>`
      : `<div class="menu-rate" style="font-size:.75rem;color:var(--soft);margin-top:.25rem">${t('price_not_set')}</div>`;
    const card = document.createElement('div');
    card.className = 'cost-menu-card';
    card.innerHTML = `
      <div class="menu-name">${esc(menu)}</div>
      <div class="menu-cost">${totalCost.toLocaleString()} IQD</div>
      ${sellingPrice > 0 ? `<div style="font-size:.78rem;color:var(--soft)">${t('selling_price_lbl')} ${sellingPrice.toLocaleString()} IQD</div>` : ''}
      ${rateHtml}
      <div class="menu-sub">${items.length} ${t('all_cost_ing_count')}</div>
    `;
    grid.appendChild(card);
  });

  renderPriceEditor(menus, priceMap);
}

function togglePriceEditor() {
  const body = document.getElementById('priceEditorBody');
  const toggle = document.getElementById('priceEditorToggle');
  if (body.classList.contains('hidden')) {
    body.classList.remove('hidden');
    toggle.textContent = t('cat_toggle_collapse');
  } else {
    body.classList.add('hidden');
    toggle.textContent = t('cat_toggle_expand');
  }
}

function renderPriceEditor(menus, priceMap) {
  const grid = document.getElementById('priceEditorGrid');
  if (!grid) return;
  grid.innerHTML = '';
  menus.forEach(menu => {
    const val = priceMap[menu] || '';
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:.4rem;background:var(--off);border-radius:var(--r-sm);padding:.4rem .6rem';
    div.innerHTML = `
      <span style="flex:1;font-size:.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(menu)}">${esc(menu)}</span>
      <input type="number" min="0" step="100" placeholder="${t('selling_price_lbl')}" value="${esc(String(val))}"
        style="width:100px;font-size:.82rem;padding:.25rem .4rem;border:1px solid var(--border);border-radius:.3rem;background:var(--bg)"
        id="price_${esc(menu.replace(/[^a-z0-9]/gi, '_'))}"
        onchange="saveMenuPrice('${esc(menu.replace(/'/g, "\\'"))}', this.value)">
      <span style="font-size:.75rem;color:var(--soft)">IQD</span>
    `;
    grid.appendChild(div);
  });
}

async function saveMenuPrice(menuItem, value) {
  const price = parseFloat(value);
  if (!Number.isFinite(price) || price < 0) return;
  try {
    const resp = await apiFetch('/api/menu-prices', {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify({ menu_item: menuItem, selling_price: price })
    });
    if (!resp.ok) { alert(t('err_save_net')); return; }
    await loadAllCosts(_cachedGrouped);
  } catch (e) {
    console.warn('[wh-save-price] failed', e);
    alert(t('err_save_net'));
  }
}

// ══════════════════════════════════════════════
// 소비 리포트
// ══════════════════════════════════════════════
function getReportDateRange() {
  const period = document.getElementById('reportPeriod')?.value || 'month';
  const now = new Date();
  let start;
  if (period === 'week') {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
  } else if (period === '3month') {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return start;
}

async function loadReport() {
  const tb = document.getElementById('reportTb');
  const canvas = document.getElementById('reportChart');
  if (!tb || !canvas) return;
  tb.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--soft)">${t('report_loading')}</td></tr>`;

  try {
    const histResp = await apiFetch('/api/inventory/history?limit=2000', { headers: hdr() });
    if (!histResp.ok) throw new Error(`HTTP ${histResp.status}`);
    const hist = await histResp.json();
    const start = getReportDateRange();

    const map = {};
    hist.forEach(h => {
      const d = new Date(h.created_at + (h.created_at.includes('Z') ? '' : 'Z'));
      if (d < start) return;
      const name = h.ingredient_name;
      if (!map[name]) map[name] = { in: 0, out: 0 };
      if (h.change_type === 'in')  map[name].in  += h.quantity;
      if (h.change_type === 'out') map[name].out += h.quantity;
    });

    const entries = Object.entries(map);
    if (!entries.length) {
      tb.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--soft);padding:1.5rem">${t('report_empty')}</td></tr>`;
      canvas.height = 0;
      return;
    }

    // 테이블 렌더링
    tb.innerHTML = '';
    entries.sort((a,b) => b[1].out - a[1].out).forEach(([name, v]) => {
      const net = v.in - v.out;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${esc(name)}</td>
        <td style="color:var(--green);font-weight:700">+${v.in.toFixed(2)}</td>
        <td style="color:var(--red);font-weight:700">-${v.out.toFixed(2)}</td>
        <td style="font-weight:700;color:${net>=0?'var(--green)':'var(--red)'}">${net>=0?'+':''}${net.toFixed(2)}</td>
      `;
      tb.appendChild(tr);
    });

    // TOP 10 차트
    const top10 = entries.sort((a,b) => b[1].out - a[1].out).slice(0, 10);
    drawBarChart(canvas, top10.map(([n]) => n), top10.map(([,v]) => v.out));
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--red);padding:1rem">${t('err_load')}</td></tr>`;
  }
}

function drawBarChart(canvas, labels, values) {
  const maxVal = Math.max(...values, 1);
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement.clientWidth - 48;
  const H = 300;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  // 매 렌더마다 transform을 초기화해야 dpr 스케일이 누적되지 않음
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const padL = 10, padR = 10, padT = 20, padB = 56;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = labels.length;
  const barW = Math.floor(chartW / n * 0.6);
  const gap   = Math.floor(chartW / n * 0.4);

  // grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH * (1 - i / 4);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
  }

  // bars
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#22c55e';
  labels.forEach((lbl, i) => {
    const x = padL + i * (barW + gap) + gap / 2;
    const bH = (values[i] / maxVal) * chartH;
    const y  = padT + chartH - bH;

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, bH, [4,4,0,0])
                  : ctx.rect(x, y, barW, bH);
    ctx.fill();

    // value label
    ctx.fillStyle = '#374151';
    ctx.font = `bold ${Math.min(11, barW * 0.45)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(values[i].toFixed(1), x + barW / 2, y - 4);

    // x-axis label (truncated)
    const maxChars = Math.max(4, Math.floor(barW / 6));
    const short = lbl.length > maxChars ? lbl.slice(0, maxChars) + '…' : lbl;
    ctx.fillStyle = '#6b7280';
    ctx.font = `${Math.min(10, barW * 0.38)}px sans-serif`;
    ctx.save();
    ctx.translate(x + barW / 2, padT + chartH + 8);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'right';
    ctx.fillText(short, 0, 0);
    ctx.restore();
  });
}

// ══════════════════════════════════════════════
// 모달
// ══════════════════════════════════════════════
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) el.classList.add('hidden'); });
});

// ══════════════════════════════════════════════
// PURCHASE ORDERS (PO)
// ══════════════════════════════════════════════
let _poCachedIngredients = null;
let _poCachedSuppliers = null;

async function _loadPoLookups() {
  if (!_poCachedIngredients) {
    const r = await apiFetch('/api/ingredients', { headers: hdr() });
    _poCachedIngredients = await r.json();
  }
  if (!_poCachedSuppliers) {
    const r = await apiFetch('/api/suppliers', { headers: hdr() });
    _poCachedSuppliers = await r.json();
  }
  return { ings: _poCachedIngredients, suppliers: _poCachedSuppliers };
}

function fmtMoney(v) { return (Math.round(v || 0)).toLocaleString() + ' IQD'; }
function fmtDate(ms) { if (!ms) return '-'; const d = new Date(ms); return d.toISOString().slice(0, 16).replace('T', ' '); }

const PO_STATUS_LABEL = {
  draft: '📝 Draft', pending_approval: '⏳ Pending Approval', approved: '✅ Approved',
  partially_received: '📦 Partial', received: '✔️ Received', cancelled: '❌ Cancelled'
};

async function loadPoList() {
  const status = document.getElementById('poFilterStatus').value;
  const url = '/api/po' + (status ? `?status=${encodeURIComponent(status)}` : '');
  try {
    const r = await apiFetch(url, { headers: hdr() });
    const rows = await r.json();
    const tb = document.getElementById('poTb');
    tb.innerHTML = rows.map(r => `
      <tr>
        <td><strong>${r.po_number}</strong></td>
        <td>${r.supplier_name || '-'}</td>
        <td>${PO_STATUS_LABEL[r.status] || r.status}</td>
        <td>-</td>
        <td>${fmtMoney(r.total_amount)}</td>
        <td>${fmtDate(r.created_at)}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openPoDetail(${r.id})">Open</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--soft)">No POs</td></tr>';
  } catch (e) { console.error(e); }
}

async function openPoModal(po) {
  await _loadPoLookups();
  document.getElementById('poId').value = po ? po.id : '';
  document.getElementById('poModalTitle').textContent = po ? `Edit ${po.po_number}` : 'New Purchase Order';
  const supSel = document.getElementById('poSupplier');
  supSel.innerHTML = '<option value="">— None —</option>' +
    _poCachedSuppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  if (po) supSel.value = po.supplier_id || '';
  document.getElementById('poExpectedDate').value = po && po.expected_date ? po.expected_date : '';
  document.getElementById('poNotes').value = po && po.notes ? po.notes : '';
  document.getElementById('poItems').innerHTML = '';
  document.getElementById('poModalMsg').textContent = '';
  if (po && po.items && po.items.length) {
    po.items.forEach(it => addPoItemRow(it));
  } else {
    addPoItemRow();
  }
  recalcPoTotal();
  document.getElementById('poModal').classList.remove('hidden');
}

function addPoItemRow(it) {
  const wrap = document.getElementById('poItems');
  const idx = wrap.children.length;
  const div = document.createElement('div');
  div.className = 'po-item-row';
  div.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:.4rem;margin-bottom:.4rem;align-items:end';
  div.innerHTML = `
    <div class="form-group" style="margin:0">
      <label>Ingredient</label>
      <select class="po-ing-sel" data-poi-id="${it ? it.id : ''}">
        ${_poCachedIngredients.map(i => `<option value="${i.id}">${i.name_ko}</option>`).join('')}
      </select>
    </div>
    <div class="form-group" style="margin:0">
      <label>Qty</label>
      <input class="po-qty" type="number" min="0" step="0.01" value="${it ? it.ordered_qty : ''}">
    </div>
    <div class="form-group" style="margin:0">
      <label>Unit Cost</label>
      <input class="po-cost" type="number" min="0" step="1" value="${it ? it.unit_cost : ''}">
    </div>
    <div class="form-group" style="margin:0">
      <label>Line Total</label>
      <input class="po-line" type="text" readonly value="${it ? Math.round(it.line_total) : 0}">
    </div>
    <button class="btn btn-outline btn-sm" onclick="this.parentNode.remove();recalcPoTotal()">×</button>
  `;
  wrap.appendChild(div);
  if (it) div.querySelector('.po-ing-sel').value = it.ingredient_id;
  div.querySelector('.po-qty').addEventListener('input', recalcPoTotal);
  div.querySelector('.po-cost').addEventListener('input', recalcPoTotal);
  recalcPoTotal();
}

function recalcPoTotal() {
  let total = 0;
  document.querySelectorAll('#poItems .po-item-row').forEach(row => {
    const q = parseFloat(row.querySelector('.po-qty').value) || 0;
    const c = parseFloat(row.querySelector('.po-cost').value) || 0;
    const lt = q * c;
    row.querySelector('.po-line').value = Math.round(lt);
    total += lt;
  });
  document.getElementById('poTotal').textContent = 'Total: ' + fmtMoney(total);
}

async function savePo(submitAfter) {
  const id = document.getElementById('poId').value;
  const supplier_id = document.getElementById('poSupplier').value || null;
  const expected_date = document.getElementById('poExpectedDate').value || null;
  const notes = document.getElementById('poNotes').value || null;
  const items = [];
  document.querySelectorAll('#poItems .po-item-row').forEach(row => {
    const ing = parseInt(row.querySelector('.po-ing-sel').value, 10);
    const q = parseFloat(row.querySelector('.po-qty').value);
    const c = parseFloat(row.querySelector('.po-cost').value);
    if (Number.isInteger(ing) && q > 0 && c >= 0) {
      items.push({ ingredient_id: ing, ordered_qty: q, unit_cost: c });
    }
  });
  if (items.length === 0) {
    document.getElementById('poModalMsg').textContent = 'Add at least one valid item';
    return;
  }
  const body = JSON.stringify({ supplier_id, expected_date, notes, items });
  try {
    let res;
    if (id) {
      res = await apiFetch('/api/po/' + id, { method: 'PUT', headers: hdr(), body });
    } else {
      res = await apiFetch('/api/po', { method: 'POST', headers: hdr(), body });
    }
    const j = await res.json();
    if (!res.ok) {
      document.getElementById('poModalMsg').textContent = j.error || 'save failed';
      return;
    }
    const poId = id || j.po.id;
    if (submitAfter) {
      await apiFetch('/api/po/' + poId + '/submit', { method: 'POST', headers: hdr() });
    }
    closeModal('poModal');
    loadPoList();
  } catch (e) {
    document.getElementById('poModalMsg').textContent = 'Network error';
  }
}

async function openPoDetail(id) {
  try {
    const r = await apiFetch('/api/po/' + id, { headers: hdr() });
    const po = await r.json();
    document.getElementById('poDetailTitle').textContent = `${po.po_number} — ${PO_STATUS_LABEL[po.status]}`;
    const itemsHtml = po.items.map(it => {
      const remaining = it.ordered_qty - it.received_qty;
      return `
        <tr data-poi-id="${it.id}">
          <td>${it.name_ko}</td>
          <td>${it.ordered_qty} ${it.unit}</td>
          <td>${it.received_qty} ${it.unit}</td>
          <td>${remaining.toFixed(2)} ${it.unit}</td>
          <td>${fmtMoney(it.unit_cost)}</td>
          <td>${fmtMoney(it.line_total)}</td>
          <td>
            ${(po.status === 'approved' || po.status === 'partially_received') && remaining > 0 ? `
              <input class="rcv-qty" type="number" min="0" max="${remaining}" step="0.01" placeholder="qty" style="width:80px">
              <input class="rcv-loc" type="text" placeholder="2A1" style="width:60px;text-transform:uppercase">
            ` : '-'}
          </td>
        </tr>`;
    }).join('');
    const receiptsHtml = (po.receipts || []).map(r => `
      <div class="card" style="margin:.4rem 0">
        <div style="font-weight:700">📦 Receipt #${r.id} — ${fmtDate(r.received_at)} ${r.received_by ? '(' + r.received_by + ')' : ''}</div>
        ${r.notes ? `<div style="font-size:.85rem;color:var(--soft)">${r.notes}</div>` : ''}
        <table style="width:100%;font-size:.9rem"><thead><tr><th>Item</th><th>Qty</th><th>Location</th></tr></thead>
        <tbody>${r.items.map(ri => `<tr><td>${ri.name_ko}</td><td>${ri.qty} ${ri.unit}</td><td>${ri.location_code}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    `).join('') || '<div style="color:var(--soft)">No receipts yet</div>';

    const actions = [];
    if (po.status === 'draft') {
      actions.push(`<button class="btn btn-primary btn-sm" onclick='editPoFromDetail(${JSON.stringify(po)})'>Edit</button>`);
      actions.push(`<button class="btn btn-primary btn-sm" onclick="submitPo(${id})" style="background:#3b82f6">Submit for Approval</button>`);
      actions.push(`<button class="btn btn-outline btn-sm" onclick="cancelPo(${id})" style="color:#ef4444">Cancel</button>`);
      actions.push(`<button class="btn btn-outline btn-sm" onclick="deletePo(${id})" style="color:#ef4444">Delete</button>`);
    } else if (po.status === 'pending_approval') {
      actions.push(`<button class="btn btn-primary btn-sm" onclick="approvePo(${id})" style="background:#10b981">Approve</button>`);
      actions.push(`<button class="btn btn-outline btn-sm" onclick="cancelPo(${id})" style="color:#ef4444">Cancel</button>`);
    } else if (po.status === 'approved' || po.status === 'partially_received') {
      actions.push(`<button class="btn btn-primary btn-sm" onclick="receivePo(${id})">📥 Receive Items</button>`);
      if (po.status === 'approved') {
        actions.push(`<button class="btn btn-outline btn-sm" onclick="cancelPo(${id})" style="color:#ef4444">Cancel</button>`);
      }
    }

    document.getElementById('poDetailBody').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.5rem;font-size:.92rem">
        <div><strong>Supplier:</strong> ${po.supplier_name || '-'}</div>
        <div><strong>Expected:</strong> ${po.expected_date || '-'}</div>
        <div><strong>Total:</strong> ${fmtMoney(po.total_amount)}</div>
        <div><strong>Created:</strong> ${fmtDate(po.created_at)} ${po.created_by ? '(' + po.created_by + ')' : ''}</div>
        ${po.submitted_at ? `<div><strong>Submitted:</strong> ${fmtDate(po.submitted_at)}</div>` : ''}
        ${po.approved_at ? `<div><strong>Approved:</strong> ${fmtDate(po.approved_at)} (${po.approved_by})</div>` : ''}
      </div>
      ${po.notes ? `<div style="margin-top:.4rem;padding:.4rem;background:rgba(0,0,0,.04);border-radius:6px">${po.notes}</div>` : ''}
      <h4 style="margin-top:.8rem">Items</h4>
      <div class="tbl-wrap"><table id="poDetailItemTable">
        <thead><tr><th>Item</th><th>Ordered</th><th>Received</th><th>Remaining</th><th>Unit Cost</th><th>Line Total</th><th>Receive</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table></div>
      <div style="margin-top:.6rem;display:flex;gap:.4rem;flex-wrap:wrap">${actions.join('')}</div>
      <h4 style="margin-top:1rem">Receipt History</h4>
      ${receiptsHtml}
    `;
    document.getElementById('poDetailModal').classList.remove('hidden');
  } catch (e) {
    alert('Failed to load PO: ' + e.message);
  }
}

async function editPoFromDetail(po) {
  closeModal('poDetailModal');
  await openPoModal(po);
}

async function submitPo(id) {
  if (!confirm('Submit this PO for approval?')) return;
  const r = await apiFetch('/api/po/' + id + '/submit', { method: 'POST', headers: hdr() });
  if (!r.ok) { const j = await r.json(); alert(j.error || 'submit failed'); return; }
  closeModal('poDetailModal');
  loadPoList();
}

async function approvePo(id) {
  if (!confirm('Approve this PO?')) return;
  const r = await apiFetch('/api/po/' + id + '/approve', { method: 'POST', headers: hdr(), body: JSON.stringify({ approved_by: 'admin' }) });
  if (!r.ok) { const j = await r.json(); alert(j.error || 'approve failed'); return; }
  closeModal('poDetailModal');
  loadPoList();
}

async function cancelPo(id) {
  if (!confirm('Cancel this PO?')) return;
  const r = await apiFetch('/api/po/' + id + '/cancel', { method: 'POST', headers: hdr() });
  if (!r.ok) { const j = await r.json(); alert(j.error || 'cancel failed'); return; }
  closeModal('poDetailModal');
  loadPoList();
}

async function deletePo(id) {
  if (!confirm('Delete this PO permanently?')) return;
  const r = await apiFetch('/api/po/' + id, { method: 'DELETE', headers: hdr() });
  if (!r.ok) { const j = await r.json(); alert(j.error || 'delete failed'); return; }
  closeModal('poDetailModal');
  loadPoList();
}

async function receivePo(id) {
  const rows = document.querySelectorAll('#poDetailItemTable tbody tr');
  const items = [];
  for (const tr of rows) {
    const poiId = parseInt(tr.dataset.poiId, 10);
    const qInput = tr.querySelector('.rcv-qty');
    const lInput = tr.querySelector('.rcv-loc');
    if (!qInput) continue;
    const q = parseFloat(qInput.value);
    const loc = (lInput.value || '').trim().toUpperCase();
    if (Number.isFinite(q) && q > 0) {
      items.push({ po_item_id: poiId, qty: q, location_code: loc || 'UNSET' });
    }
  }
  if (items.length === 0) { alert('Enter at least one receive qty'); return; }
  const r = await apiFetch('/api/po/' + id + '/receive', {
    method: 'POST', headers: hdr(),
    body: JSON.stringify({ items, received_by: 'admin' })
  });
  const j = await r.json();
  if (!r.ok) { alert(j.error || 'receive failed'); return; }
  closeModal('poDetailModal');
  loadPoList();
  loadIngredients(false);
}

// ══════════════════════════════════════════════
// STOCK COUNTS (PHYSICAL INVENTORY)
// ══════════════════════════════════════════════
const COUNT_STATUS_LABEL = {
  open: '📝 Open', submitted: '⏳ Submitted', reconciled: '✅ Reconciled', cancelled: '❌ Cancelled'
};

async function loadCountList() {
  try {
    const r = await apiFetch('/api/stock-counts', { headers: hdr() });
    const rows = await r.json();
    const tb = document.getElementById('countTb');
    tb.innerHTML = rows.map(c => `
      <tr>
        <td><strong>${esc(c.count_name)}</strong></td>
        <td>${COUNT_STATUS_LABEL[c.status] || c.status}</td>
        <td>${c.item_count}</td>
        <td style="color:${c.total_variance_value < 0 ? '#ef4444' : '#10b981'}">${fmtMoney(c.total_variance_value)}</td>
        <td>${fmtDate(c.created_at)}</td>
        <td><button class="btn btn-outline btn-sm" onclick="openCountDetail(${c.id})">Open</button></td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--soft)">No counts</td></tr>';
  } catch (e) { console.warn('[wh-counts] list fetch failed', e); }
}

async function openCountModal() {
  // Populate categories
  const ings = (_poCachedIngredients || (await _loadPoLookups()).ings);
  const cats = Array.from(new Set(ings.map(i => i.category).filter(Boolean))).sort();
  document.getElementById('countCategory').innerHTML =
    '<option value="">All categories</option>' + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  document.getElementById('countName').value = `Count ${new Date().toISOString().slice(0, 10)}`;
  document.getElementById('countNotes').value = '';
  document.getElementById('countModalMsg').textContent = '';
  document.getElementById('countModal').classList.remove('hidden');
}

async function createStockCount() {
  const count_name = document.getElementById('countName').value.trim();
  const category = document.getElementById('countCategory').value || null;
  const notes = document.getElementById('countNotes').value || null;
  if (!count_name) {
    document.getElementById('countModalMsg').textContent = 'Name required';
    return;
  }
  const r = await apiFetch('/api/stock-counts', {
    method: 'POST', headers: hdr(),
    body: JSON.stringify({ count_name, notes, category, started_by: 'admin' })
  });
  const j = await r.json();
  if (!r.ok) { document.getElementById('countModalMsg').textContent = j.error || 'failed'; return; }
  closeModal('countModal');
  await loadCountList();
  openCountDetail(j.id);
}

async function openCountDetail(id) {
  const r = await apiFetch('/api/stock-counts/' + id, { headers: hdr() });
  const sc = await r.json();
  const editable = sc.status === 'open';
  const itemsHtml = sc.items.map(it => {
    const counted = it.counted_qty == null ? '' : it.counted_qty;
    const variance = it.variance_qty == null ? '-' : (it.variance_qty.toFixed(3));
    const vValue = it.variance_value == null ? '-' : fmtMoney(it.variance_value);
    const vColor = it.variance_qty == null ? '' : (it.variance_qty < 0 ? '#ef4444' : '#10b981');
    return `
      <tr data-ing-id="${it.ingredient_id}">
        <td>${esc(it.name_ko)} <span style="color:var(--soft);font-size:.8rem">(${it.unit})</span></td>
        <td>${it.expected_qty.toFixed(2)}</td>
        <td>${editable
        ? `<input class="sci-counted" type="number" step="0.01" min="0" value="${counted}" style="width:90px">`
        : (it.counted_qty == null ? '-' : it.counted_qty.toFixed(2))}</td>
        <td style="color:${vColor}">${variance}</td>
        <td style="color:${vColor}">${vValue}</td>
        <td>${editable
        ? `<input class="sci-notes" type="text" value="${esc(it.notes || '')}" style="width:140px">`
        : esc(it.notes || '')}</td>
      </tr>
    `;
  }).join('');

  const actions = [];
  if (sc.status === 'open') {
    actions.push(`<button class="btn btn-primary btn-sm" onclick="saveCountItems(${id})">💾 Save Counts</button>`);
    actions.push(`<button class="btn btn-primary btn-sm" onclick="submitCount(${id})" style="background:#3b82f6">Submit (compute variance)</button>`);
    actions.push(`<button class="btn btn-outline btn-sm" onclick="cancelCount(${id})" style="color:#ef4444">Cancel</button>`);
    actions.push(`<button class="btn btn-outline btn-sm" onclick="deleteCount(${id})" style="color:#ef4444">Delete</button>`);
  } else if (sc.status === 'submitted') {
    actions.push(`<button class="btn btn-primary btn-sm" onclick="reconcileCount(${id})" style="background:#10b981">✅ Reconcile (apply to stock)</button>`);
    actions.push(`<button class="btn btn-outline btn-sm" onclick="cancelCount(${id})" style="color:#ef4444">Cancel</button>`);
  }

  document.getElementById('countDetailTitle').textContent = `${sc.count_name} — ${COUNT_STATUS_LABEL[sc.status]}`;
  document.getElementById('countDetailBody').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.5rem;font-size:.92rem">
      <div><strong>Status:</strong> ${COUNT_STATUS_LABEL[sc.status]}</div>
      <div><strong>Items:</strong> ${sc.items.length}</div>
      <div><strong>Variance:</strong> <span style="color:${sc.total_variance_value < 0 ? '#ef4444' : '#10b981'}">${fmtMoney(sc.total_variance_value)}</span></div>
      <div><strong>Created:</strong> ${fmtDate(sc.created_at)}</div>
      ${sc.submitted_at ? `<div><strong>Submitted:</strong> ${fmtDate(sc.submitted_at)}</div>` : ''}
      ${sc.reconciled_at ? `<div><strong>Reconciled:</strong> ${fmtDate(sc.reconciled_at)} (${sc.reconciled_by})</div>` : ''}
    </div>
    ${sc.notes ? `<div style="margin-top:.4rem;padding:.4rem;background:rgba(0,0,0,.04);border-radius:6px">${esc(sc.notes)}</div>` : ''}
    <div style="margin-top:.6rem;display:flex;gap:.4rem;flex-wrap:wrap">${actions.join('')}</div>
    <div class="tbl-wrap" style="margin-top:.8rem"><table id="scItemTable">
      <thead><tr><th>Ingredient</th><th>Expected</th><th>Counted</th><th>Variance Qty</th><th>Variance Value</th><th>Notes</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table></div>
  `;
  document.getElementById('countDetailModal').classList.remove('hidden');
}

async function saveCountItems(id) {
  const items = [];
  document.querySelectorAll('#scItemTable tbody tr').forEach(tr => {
    const ingId = parseInt(tr.dataset.ingId, 10);
    const c = tr.querySelector('.sci-counted');
    const n = tr.querySelector('.sci-notes');
    if (!c) return;
    const v = c.value === '' ? null : parseFloat(c.value);
    items.push({ ingredient_id: ingId, counted_qty: v, notes: n ? n.value : null });
  });
  const r = await apiFetch('/api/stock-counts/' + id + '/items', {
    method: 'PUT', headers: hdr(), body: JSON.stringify({ items })
  });
  if (!r.ok) { const j = await r.json(); alert(j.error || 'save failed'); return; }
  alert('Saved');
}

async function submitCount(id) {
  if (!confirm('Submit count? Variance will be computed.')) return;
  await saveCountItems(id);
  const r = await apiFetch('/api/stock-counts/' + id + '/submit', { method: 'POST', headers: hdr() });
  if (!r.ok) { const j = await r.json(); alert(j.error || 'submit failed'); return; }
  closeModal('countDetailModal');
  loadCountList();
}

async function reconcileCount(id) {
  if (!confirm('Reconcile count? Stock will be adjusted to counted values.')) return;
  const r = await apiFetch('/api/stock-counts/' + id + '/reconcile', {
    method: 'POST', headers: hdr(), body: JSON.stringify({ reconciled_by: 'admin' })
  });
  if (!r.ok) { const j = await r.json(); alert(j.error || 'reconcile failed'); return; }
  closeModal('countDetailModal');
  loadCountList();
  loadIngredients(false);
}

async function cancelCount(id) {
  if (!confirm('Cancel this count?')) return;
  const r = await apiFetch('/api/stock-counts/' + id + '/cancel', { method: 'POST', headers: hdr() });
  if (!r.ok) { const j = await r.json(); alert(j.error || 'cancel failed'); return; }
  closeModal('countDetailModal');
  loadCountList();
}

async function deleteCount(id) {
  if (!confirm('Delete this count permanently?')) return;
  const r = await apiFetch('/api/stock-counts/' + id, { method: 'DELETE', headers: hdr() });
  if (!r.ok) { const j = await r.json(); alert(j.error || 'delete failed'); return; }
  closeModal('countDetailModal');
  loadCountList();
}

// ══════════════════════════════════════════════
// PROFITABILITY DASHBOARD
// ══════════════════════════════════════════════
async function loadProfitability() {
  const period = document.getElementById('profitPeriod').value;
  try {
    const [sumRes, abcRes, effRes] = await Promise.all([
      apiFetch('/api/profitability/summary?period=' + period, { headers: hdr() }),
      apiFetch('/api/profitability/abc?period=' + period, { headers: hdr() }),
      apiFetch('/api/profitability/effective-margin?period=' + period, { headers: hdr() }),
    ]);
    const sum = await sumRes.json();
    const abc = await abcRes.json();
    const eff = await effRes.json();

    document.getElementById('pfRevenue').textContent = fmtMoney(sum.totals.revenue);
    document.getElementById('pfCogs').textContent = fmtMoney(sum.totals.cost);
    document.getElementById('pfGross').textContent = fmtMoney(sum.totals.gross_profit);
    document.getElementById('pfMarginRate').textContent = sum.totals.margin_rate + '%';
    document.getElementById('pfRefunds').textContent = fmtMoney(eff.refunds);
    document.getElementById('pfWaste').textContent = fmtMoney(eff.waste_estimate);
    document.getElementById('pfEffective').textContent = fmtMoney(eff.effective_profit);
    document.getElementById('pfEffectiveRate').textContent = eff.effective_margin_rate + '%';

    const tb = document.getElementById('profitTb');
    tb.innerHTML = sum.rows.map(r => `
      <tr>
        <td>${esc(r.menu_item)}</td>
        <td>${fmtMoney(r.cost)}</td>
        <td>${fmtMoney(r.selling_price)}</td>
        <td style="color:${r.margin < 0 ? '#ef4444' : '#10b981'}">${fmtMoney(r.margin)}</td>
        <td>${r.margin_rate}%</td>
        <td>${r.qty_sold}</td>
        <td>${fmtMoney(r.revenue)}</td>
        <td style="color:${r.gross_profit < 0 ? '#ef4444' : '#10b981'}"><strong>${fmtMoney(r.gross_profit)}</strong></td>
        <td><button class="btn btn-outline btn-sm" onclick='showIngredientImpact(${JSON.stringify(r.menu_item)})'>🔍</button></td>
      </tr>
    `).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--soft)">No data</td></tr>';

    const abcTb = document.getElementById('abcTb');
    abcTb.innerHTML = abc.rows.map(r => `
      <tr>
        <td><strong style="color:${r.abc_class === 'A' ? '#10b981' : r.abc_class === 'B' ? '#f59e0b' : '#94a3b8'}">${r.abc_class}</strong></td>
        <td>${esc(r.menu_item)}</td>
        <td>${r.qty}</td>
        <td>${fmtMoney(r.revenue)}</td>
        <td>${r.cumulative_ratio}%</td>
        <td>${fmtMoney(r.profit)}</td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--soft)">No data</td></tr>';

    // Populate simulator menu list
    const simMenu = document.getElementById('simMenu');
    simMenu.innerHTML = sum.rows.map(r => `<option value="${esc(r.menu_item)}">${esc(r.menu_item)}</option>`).join('');
    if (sum.rows.length > 0) {
      simMenu.value = sum.rows[0].menu_item;
      document.getElementById('simPrice').value = sum.rows[0].selling_price;
    }
  } catch (e) { console.error(e); }
}

async function runSimulator() {
  const menu = document.getElementById('simMenu').value;
  const price = document.getElementById('simPrice').value;
  const fixed = document.getElementById('simFixed').value || 0;
  if (!menu || price === '') return;
  const r = await apiFetch(`/api/profitability/simulate?menu_item=${encodeURIComponent(menu)}&new_price=${price}&fixed_cost=${fixed}`, { headers: hdr() });
  const j = await r.json();
  if (!r.ok) { alert(j.error || 'failed'); return; }
  const delta = j.margin_delta;
  const deltaColor = delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '';
  document.getElementById('simResult').innerHTML = `
    <div class="card" style="background:rgba(59,130,246,.05);border-left:4px solid #3b82f6">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.5rem">
        <div><span style="color:var(--soft)">Cost:</span> <strong>${fmtMoney(j.cost)}</strong></div>
        <div><span style="color:var(--soft)">Old Price:</span> <strong>${fmtMoney(j.old_price)}</strong></div>
        <div><span style="color:var(--soft)">New Price:</span> <strong>${fmtMoney(j.new_price)}</strong></div>
        <div><span style="color:var(--soft)">Old Margin:</span> <strong>${fmtMoney(j.old_margin)}</strong></div>
        <div><span style="color:var(--soft)">New Margin:</span> <strong>${fmtMoney(j.new_margin)}</strong></div>
        <div><span style="color:var(--soft)">Δ Margin:</span> <strong style="color:${deltaColor}">${delta > 0 ? '+' : ''}${fmtMoney(delta)}</strong></div>
        <div><span style="color:var(--soft)">New Margin %:</span> <strong>${j.new_margin_rate}%</strong></div>
        ${j.break_even_qty != null ? `<div><span style="color:var(--soft)">Break-Even Qty:</span> <strong>${j.break_even_qty}</strong></div>` : ''}
      </div>
    </div>
  `;
}

async function showIngredientImpact(menu) {
  const r = await apiFetch('/api/profitability/ingredient-impact?menu_item=' + encodeURIComponent(menu), { headers: hdr() });
  const j = await r.json();
  if (!r.ok) { alert(j.error || 'failed'); return; }
  const lines = j.items.map(i => `${i.name_ko}: ${fmtMoney(i.line_cost)} (${i.cost_share}% of cost, ${i.margin_share}% of price)`).join('\n');
  alert(`${menu}\nTotal Cost: ${fmtMoney(j.total_cost)} | Margin: ${fmtMoney(j.margin)}\n\n${lines || 'No recipe'}`);
}

// ── 탭 진입 시 자동 로드: showTab은 이미 정의되어 있음, 추가 트리거만 ──
(function _wirePoCountProfitTabs() {
  const oldShow = window.showTab;
  window.showTab = function (id, btn) {
    oldShow(id, btn);
    if (id === 'po') loadPoList();
    if (id === 'counts') loadCountList();
    if (id === 'profit') loadProfitability();
  };
})();

// ══════════════════════════════════════════════
// 메뉴 (POS/웹과 공유, 단일 소스 menu_items_v2)
// ══════════════════════════════════════════════
const menuState = {
  items: [],
  categories: [],
  ingredients: [],
  modifierGroups: [],   // [{ id, code, name_*, selection, required, options: [...] }]
  itemGroupIds: [],     // group_ids attached to currently-edited item
  editing: null,        // { id?, recipe? } or null for new
  pendingPhotoFile: null,    // File chosen in editor, uploaded on Save
  pendingPhotoRemove: false, // user clicked "Remove"; flush DB photo_url to null on Save
};

async function loadMenuTab() {
  try {
    const [mRes, cRes, iRes, gRes] = await Promise.all([
      apiFetch('/api/menu/with-cost', { headers: hdr() }),
      apiFetch('/api/admin/menu/categories', { headers: hdr() }),
      apiFetch('/api/ingredients', { headers: hdr() }),
      apiFetch('/api/admin/menu/modifier-groups', { headers: hdr() }),
    ]);
    if (!mRes.ok) throw new Error('menu_load_failed');
    if (!cRes.ok) throw new Error('cat_load_failed');
    if (!iRes.ok) throw new Error('ing_load_failed');
    menuState.items = await mRes.json();
    menuState.categories = await cRes.json();
    menuState.ingredients = await iRes.json();
    menuState.modifierGroups = gRes.ok ? await gRes.json() : [];
    renderMenuTab();
    if (!document.getElementById('menuCatMgrBody')?.classList.contains('hidden')) {
      renderMenuCatMgr();
    }
  } catch (e) {
    if (e?.message === 'unauthorized') return;
    const c = document.getElementById('menuCategoriesContainer');
    if (c) c.innerHTML = `<div class="card" style="color:var(--danger)">⚠️ ${esc(e.message || 'load failed')}</div>`;
  }
}

// ══════════════════════════════════════════════
// Sortable helper — drag & drop + ↑↓ buttons (shared)
// Caller passes a container element that owns `.sortable-item[data-sid]`
// children. On reorder, callbackPromise receives the new id-list (numbers)
// and should persist it (eg. PUT a reorder API) and resolve.
// ══════════════════════════════════════════════
function attachSortable(container, onReorder) {
  if (!container || container._sortableBound) return;
  container._sortableBound = true;
  let dragged = null;

  container.addEventListener('dragstart', e => {
    const item = e.target.closest('.sortable-item');
    if (!item || !container.contains(item)) return;
    dragged = item;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.dataset.sid || '');
  });
  container.addEventListener('dragend', () => {
    if (dragged) dragged.classList.remove('dragging');
    container.querySelectorAll('.sortable-item.drag-over').forEach(el => el.classList.remove('drag-over'));
    dragged = null;
  });
  container.addEventListener('dragover', e => {
    if (!dragged) return;
    e.preventDefault();
    const over = e.target.closest('.sortable-item');
    if (!over || over === dragged || !container.contains(over)) return;
    container.querySelectorAll('.sortable-item.drag-over').forEach(el => el.classList.remove('drag-over'));
    over.classList.add('drag-over');
  });
  container.addEventListener('drop', e => {
    e.preventDefault();
    const over = e.target.closest('.sortable-item');
    if (!over || over === dragged || !container.contains(over)) return;
    const items = [...container.querySelectorAll('.sortable-item')];
    const fromIdx = items.indexOf(dragged);
    const toIdx = items.indexOf(over);
    if (fromIdx < 0 || toIdx < 0) return;
    if (fromIdx < toIdx) over.after(dragged); else over.before(dragged);
    over.classList.remove('drag-over');
    const order = [...container.querySelectorAll('.sortable-item')].map(el => parseInt(el.dataset.sid, 10));
    onReorder(order);
  });
}

// Arrow-button move helper. Caller passes the container, the sid to move,
// and direction (-1 or +1). Calls onReorder with the new id-list.
function sortableMove(container, sid, dir, onReorder) {
  const items = [...container.querySelectorAll('.sortable-item')];
  const idx = items.findIndex(el => String(el.dataset.sid) === String(sid));
  const newIdx = idx + dir;
  if (idx < 0 || newIdx < 0 || newIdx >= items.length) return;
  const moving = items[idx];
  if (dir < 0) items[newIdx].before(moving); else items[newIdx].after(moving);
  const order = [...container.querySelectorAll('.sortable-item')].map(el => parseInt(el.dataset.sid, 10));
  onReorder(order);
}

// ══════════════════════════════════════════════
// 메뉴 카테고리 관리 (server-backed via /api/admin/menu/categories)
// ══════════════════════════════════════════════
let editingMenuCatId = null;
let pendingDeleteMenuCatId = null;

function toggleMenuCatMgr() {
  const body = document.getElementById('menuCatMgrBody');
  const icon = document.getElementById('menuCatMgrToggle');
  body.classList.toggle('hidden');
  icon.textContent = body.classList.contains('hidden') ? t('cat_toggle_expand') : t('cat_toggle_collapse');
  if (!body.classList.contains('hidden')) renderMenuCatMgr();
}

function renderMenuCatMgr() {
  const list = document.getElementById('menuCatMgrList');
  if (!list) return;
  const cats = [...(menuState.categories || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  if (!cats.length) {
    list.innerHTML = `<p style="font-size:.82rem;color:var(--soft);margin-bottom:.5rem">${t('cat_empty')}</p>`;
    return;
  }
  list.innerHTML = `<div id="menuCatSortable" class="sortable-list">${cats.map((c, i) => {
    const count = (menuState.items || []).filter(it => it.category_id === c.id).length;
    return `<div class="sortable-item" draggable="true" data-sid="${c.id}">
      <span class="sortable-handle" title="Drag to reorder">⋮⋮</span>
      <button class="sortable-arrow" ${i === 0 ? 'disabled' : ''} onclick="moveMenuCat(${c.id}, -1)" aria-label="Move up">▲</button>
      <button class="sortable-arrow" ${i === cats.length - 1 ? 'disabled' : ''} onclick="moveMenuCat(${c.id}, 1)" aria-label="Move down">▼</button>
      <span style="font-size:1.05rem;flex-shrink:0">${esc(c.icon || '📦')}</span>
      <span class="grow">
        <b>${esc(c.name_en)}</b>
        <span class="ar" dir="rtl" style="margin-inline-start:.4rem;color:var(--soft)">${esc(c.name_ar || '')}</span>
        <span style="margin-inline-start:.4rem;font-size:.72rem;color:var(--soft);font-family:ui-monospace,monospace">${esc(c.code)}</span>
        <span style="margin-inline-start:.4rem;font-size:.72rem;color:var(--soft)">· ${count} items</span>
        ${c.active ? '' : '<span style="margin-inline-start:.4rem;font-size:.7rem;color:var(--red)">⛔</span>'}
      </span>
      <button class="btn btn-outline btn-sm" style="padding:.1rem .4rem;min-width:0" onclick="startEditMenuCat(${c.id})">✎</button>
      <button class="btn btn-danger btn-sm" style="padding:.1rem .4rem;min-width:0" onclick="deleteMenuCategory(${c.id})">✕</button>
    </div>`;
  }).join('')}</div>`;

  const container = document.getElementById('menuCatSortable');
  attachSortable(container, persistMenuCatOrder);
}

async function persistMenuCatOrder(order) {
  const res = await apiFetch('/api/admin/menu/categories/reorder', {
    method: 'PUT', headers: hdr(),
    body: JSON.stringify({ order })
  });
  if (!res.ok) {
    _menuCatMsg(t('menucat_err_reorder'), 'var(--red)');
    return;
  }
  // re-fetch to sync sort_order numbers — but render from local order to avoid flicker
  order.forEach((id, idx) => {
    const c = (menuState.categories || []).find(x => x.id === id);
    if (c) c.sort_order = (idx + 1) * 100;
  });
}

function moveMenuCat(id, dir) {
  const container = document.getElementById('menuCatSortable');
  if (!container) return;
  sortableMove(container, id, dir, persistMenuCatOrder);
  // refresh arrow disabled states after move
  setTimeout(renderMenuCatMgr, 100);
}

function _menuCatFormValues() {
  return {
    code:    document.getElementById('newMenuCatCode').value.trim().toLowerCase(),
    name_en: document.getElementById('newMenuCatNameEn').value.trim(),
    name_ar: document.getElementById('newMenuCatNameAr').value.trim(),
    icon:    document.getElementById('newMenuCatIcon').value.trim(),
    sort_order: parseInt(document.getElementById('newMenuCatSort').value, 10),
    active:  document.getElementById('newMenuCatActive').checked
  };
}

function _menuCatMsg(text, color) {
  const m = document.getElementById('menuCatMgrMsg');
  m.style.color = color || 'var(--soft)';
  m.textContent = text || '';
  if (text) setTimeout(() => { if (m.textContent === text) m.textContent = ''; }, 3000);
}

function submitMenuCatForm() {
  if (editingMenuCatId != null) saveEditMenuCategory(editingMenuCatId);
  else addMenuCategory();
}

async function addMenuCategory() {
  const v = _menuCatFormValues();
  if (!v.code || !/^[a-z0-9_-]{2,32}$/.test(v.code)) return _menuCatMsg(t('menucat_err_code'), 'var(--red)');
  if (!v.name_en) return _menuCatMsg(t('menucat_err_name_en'), 'var(--red)');
  if (!v.name_ar) return _menuCatMsg(t('menucat_err_name_ar'), 'var(--red)');
  lockBtn('menuCatSubmitBtn');
  try {
    const res = await apiFetch('/api/admin/menu/categories', {
      method: 'POST', headers: hdr(),
      body: JSON.stringify({
        code: v.code, name_en: v.name_en, name_ar: v.name_ar,
        icon: v.icon || null,
        sort_order: Number.isFinite(v.sort_order) ? v.sort_order : 100,
        active: v.active
      })
    });
    const r = await res.json().catch(() => ({}));
    if (!res.ok || !r.success) {
      const key = r.error === 'code_exists' ? 'menucat_err_dup' : 'menucat_err_save';
      return _menuCatMsg(t(key), 'var(--red)');
    }
    _clearMenuCatForm();
    _menuCatMsg(t('menucat_added'), 'var(--green)');
    await loadMenuTab();
  } finally {
    unlockBtn('menuCatSubmitBtn');
  }
}

function startEditMenuCat(id) {
  const c = (menuState.categories || []).find(x => x.id === id);
  if (!c) return;
  editingMenuCatId = id;
  document.getElementById('newMenuCatCode').value = c.code || '';
  document.getElementById('newMenuCatCode').disabled = true;  // code is immutable on server
  document.getElementById('newMenuCatNameEn').value = c.name_en || '';
  document.getElementById('newMenuCatNameAr').value = c.name_ar || '';
  document.getElementById('newMenuCatIcon').value = c.icon || '';
  document.getElementById('newMenuCatSort').value = c.sort_order ?? 100;
  document.getElementById('newMenuCatActive').checked = !!c.active;
  document.getElementById('menuCatSubmitBtn').textContent = t('btn_save');
  document.getElementById('menuCatCancelBtn').classList.remove('hidden');
  _menuCatMsg(t('cat_editing').replace('${name}', c.name_en), 'var(--soft)');
  document.getElementById('newMenuCatNameEn').focus();
}

async function saveEditMenuCategory(id) {
  const v = _menuCatFormValues();
  if (!v.name_en) return _menuCatMsg(t('menucat_err_name_en'), 'var(--red)');
  if (!v.name_ar) return _menuCatMsg(t('menucat_err_name_ar'), 'var(--red)');
  lockBtn('menuCatSubmitBtn');
  try {
    const res = await apiFetch(`/api/admin/menu/categories/${id}`, {
      method: 'PUT', headers: hdr(),
      body: JSON.stringify({
        name_en: v.name_en, name_ar: v.name_ar,
        icon: v.icon || '',
        sort_order: Number.isFinite(v.sort_order) ? v.sort_order : 100,
        active: v.active
      })
    });
    const r = await res.json().catch(() => ({}));
    if (!res.ok || !r.success) return _menuCatMsg(t('menucat_err_save'), 'var(--red)');
    cancelEditMenuCat();
    _menuCatMsg(t('cat_saved'), 'var(--green)');
    await loadMenuTab();
  } finally {
    unlockBtn('menuCatSubmitBtn');
  }
}

function cancelEditMenuCat() {
  editingMenuCatId = null;
  _clearMenuCatForm();
  document.getElementById('menuCatSubmitBtn').textContent = t('btn_add');
  document.getElementById('menuCatCancelBtn').classList.add('hidden');
}

function _clearMenuCatForm() {
  document.getElementById('newMenuCatCode').value = '';
  document.getElementById('newMenuCatCode').disabled = false;
  document.getElementById('newMenuCatNameEn').value = '';
  document.getElementById('newMenuCatNameAr').value = '';
  document.getElementById('newMenuCatIcon').value = '';
  document.getElementById('newMenuCatSort').value = 100;
  document.getElementById('newMenuCatActive').checked = true;
}

async function deleteMenuCategory(id) {
  const c = (menuState.categories || []).find(x => x.id === id);
  if (!c) return;
  const name = c.name_en;
  if (!confirm(t('menucat_confirm_del').replace('${name}', name))) return;
  const res = await apiFetch(`/api/admin/menu/categories/${id}`, { method: 'DELETE', headers: hdr() });
  if (res.ok) {
    _menuCatMsg(t('menucat_deleted'), 'var(--green)');
    await loadMenuTab();
    return;
  }
  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    openMoveItemsModal(id, body.item_list || [], body.items || 0);
    return;
  }
  _menuCatMsg(t('menucat_err_delete'), 'var(--red)');
}

function openMoveItemsModal(fromId, itemList, count) {
  pendingDeleteMenuCatId = fromId;
  const from = (menuState.categories || []).find(x => x.id === fromId);
  document.getElementById('menuCatMoveMsg').textContent =
    t('menucat_move_msg').replace('${name}', from?.name_en || '').replace('${count}', String(count));
  const ul = document.getElementById('menuCatMoveItemsList');
  ul.innerHTML = itemList.length
    ? itemList.map(i => `<div>• ${esc(i.name_en)}${i.name_ar ? ` <span class="ar" dir="rtl" style="color:var(--soft)">(${esc(i.name_ar)})</span>` : ''}</div>`).join('')
    : `<div style="color:var(--soft)">—</div>`;
  const sel = document.getElementById('menuCatMoveTarget');
  const others = (menuState.categories || []).filter(c => c.id !== fromId);
  sel.innerHTML = `<option value="">${t('menucat_move_none')}</option>` +
    others.map(c => `<option value="${c.id}">${esc(c.icon || '📦')} ${esc(c.name_en)}</option>`).join('');
  document.getElementById('menuCatMoveErr').textContent = '';
  document.getElementById('menuCatMoveModal').classList.remove('hidden');
}

async function confirmMoveAndDeleteCat() {
  const fromId = pendingDeleteMenuCatId;
  if (!fromId) return;
  const toRaw = document.getElementById('menuCatMoveTarget').value;
  const errEl = document.getElementById('menuCatMoveErr');
  errEl.textContent = '';
  lockBtn('menuCatMoveBtn');
  try {
    const mvRes = await apiFetch(`/api/admin/menu/categories/${fromId}/move-items`, {
      method: 'POST', headers: hdr(),
      body: JSON.stringify({ to_category_id: toRaw === '' ? null : parseInt(toRaw, 10) })
    });
    if (!mvRes.ok) { errEl.textContent = t('menucat_err_move'); return; }
    const delRes = await apiFetch(`/api/admin/menu/categories/${fromId}`, { method: 'DELETE', headers: hdr() });
    if (!delRes.ok) { errEl.textContent = t('menucat_err_delete'); return; }
    closeModal('menuCatMoveModal');
    pendingDeleteMenuCatId = null;
    _menuCatMsg(t('menucat_deleted'), 'var(--green)');
    await loadMenuTab();
  } finally {
    unlockBtn('menuCatMoveBtn');
  }
}

function fmtIqd(n) {
  if (!Number.isFinite(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
}

function renderMenuTab() {
  const root = document.getElementById('menuCategoriesContainer');
  if (!root) return;
  const q = (document.getElementById('menuSearch')?.value || '').trim().toLowerCase();
  const showInactive = document.getElementById('menuShowInactive')?.checked === true;

  const filtered = menuState.items.filter(it => {
    if (!showInactive && !it.active) return false;
    if (!q) return true;
    return [it.code, it.name_en, it.name_ar, it.name_ko, it.category_name_en, it.category_name_ko]
      .some(v => (v || '').toLowerCase().includes(q));
  });

  if (!filtered.length) {
    root.innerHTML = `<div class="card" style="text-align:center;color:var(--soft);padding:2rem">${esc(t('menu_empty'))}</div>`;
    return;
  }

  // Group by category_id
  const groups = new Map();
  for (const it of filtered) {
    const key = it.category_id || 0;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        name_en: it.category_name_en || '— Uncategorized —',
        name_ar: it.category_name_ar || '— بدون فئة —',
        name_ko: it.category_name_ko || '',
        sort: it.category_sort ?? 9999,
        items: [],
      });
    }
    groups.get(key).items.push(it);
  }
  const sortedGroups = [...groups.values()].sort((a, b) => a.sort - b.sort || a.id - b.id);

  const lang = currentLang;
  root.innerHTML = sortedGroups.map(g => {
    const catName = lang === 'ar' ? (g.name_ar || g.name_en) : (g.name_en || g.name_ko);
    const cards = g.items.map(it => menuCardHtml(it, lang)).join('');
    return `
      <section class="menu-category">
        <header class="menu-category-head">
          <h3>${esc(catName)}</h3>
          <span class="menu-category-count">${g.items.length}</span>
        </header>
        <div class="menu-card-grid">${cards}</div>
      </section>
    `;
  }).join('');

  root.querySelectorAll('.menu-card[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt(el.getAttribute('data-id'), 10);
      const item = menuState.items.find(x => x.id === id);
      if (item) openMenuEditor(item);
    });
  });
}

function menuCardHtml(it, lang) {
  const title = lang === 'ar'
    ? (it.name_ar || it.name_en || it.code)
    : (it.name_en || it.name_ko || it.code);
  const sub = it.name_ko && it.name_ko !== title ? `<div class="menu-card-sub">${esc(it.name_ko)}</div>` : '';
  const price = Number(it.base_price) || 0;
  const cost = Number(it.cost) || 0;
  const margin = price > 0 ? Math.max(0, Math.min(100, Math.round(((price - cost) / price) * 100))) : 0;
  const costPct = price > 0 ? Math.max(0, Math.min(100, Math.round((cost / price) * 100))) : 0;
  const inactive = !it.active ? '<span class="menu-pill menu-pill-off">inactive</span>' : '';
  const soldOut = it.sold_out ? '<span class="menu-pill menu-pill-soldout">sold out</span>' : '';
  const recipeBadge = (it.recipe?.length)
    ? `<span class="menu-pill menu-pill-recipe">🧾 ${it.recipe.length}</span>`
    : `<span class="menu-pill menu-pill-norecipe">no recipe</span>`;
  const thumb = it.photo_url
    ? `<div class="menu-card-thumb"><img src="${esc(it.photo_url)}" alt=""></div>`
    : `<div class="menu-card-emoji">${esc(it.emoji || '🍽️')}</div>`;
  return `
    <article class="menu-card ${it.active ? '' : 'is-inactive'}" data-id="${it.id}" tabindex="0">
      <div class="menu-card-head">
        ${thumb}
        <div class="menu-card-titles">
          <div class="menu-card-title">${esc(title)}</div>
          ${sub}
          <code class="menu-card-code">${esc(it.code)}</code>
        </div>
      </div>
      <div class="menu-card-pills">${inactive}${soldOut}${recipeBadge}</div>
      <div class="menu-card-money">
        <div class="menu-card-row"><span>Price</span><strong>${fmtIqd(price)}</strong></div>
        <div class="menu-card-row"><span>Cost</span><strong>${fmtIqd(cost)}</strong></div>
        <div class="menu-card-row"><span>Margin</span><strong>${margin}%</strong></div>
      </div>
      <div class="menu-cost-bar"><span style="width:${costPct}%"></span></div>
    </article>
  `;
}

function _populateMenuCategorySelect(selectedId) {
  const sel = document.getElementById('menuF_category');
  if (!sel) return;
  const opts = ['<option value="">— None —</option>'];
  for (const c of menuState.categories) {
    const label = currentLang === 'ar' ? (c.name_ar || c.name_en) : (c.name_en || c.name_ko || c.code);
    opts.push(`<option value="${c.id}">${esc(label)}</option>`);
  }
  sel.innerHTML = opts.join('');
  if (selectedId != null) sel.value = String(selectedId);
}

async function openMenuEditor(item /* | null */) {
  menuState.editing = item ? { ...item } : null;
  menuState.itemGroupIds = [];
  menuState.pendingPhotoFile = null;
  menuState.pendingPhotoRemove = false;
  _populateMenuCategorySelect(item?.category_id ?? null);

  document.getElementById('menuEditorTitle').textContent = item
    ? t('menu_editor_edit_title')
    : t('menu_editor_add_title');

  document.getElementById('menuF_code').value     = item?.code || '';
  document.getElementById('menuF_code').disabled  = false; // code editable; server enforces uniqueness
  document.getElementById('menuF_name_en').value  = item?.name_en || '';
  document.getElementById('menuF_name_ar').value  = item?.name_ar || '';
  document.getElementById('menuF_emoji').value    = item?.emoji || '';
  document.getElementById('menuF_price').value    = item?.base_price ?? '';
  document.getElementById('menuF_kind').value     = item?.kind === 'set' ? 'set' : 'single';
  document.getElementById('menuF_sort').value     = item?.sort_order ?? 100;
  document.getElementById('menuF_desc').value     = item?.description || '';
  document.getElementById('menuF_active').checked = item ? !!item.active : true;
  document.getElementById('menuF_is_new').checked       = !!item?.is_new;
  document.getElementById('menuF_is_best').checked      = !!item?.is_best;
  document.getElementById('menuF_is_signature').checked = !!item?.is_signature;

  // Photo preview
  document.getElementById('menuF_photoFile').value = '';
  _renderMenuPhotoPreview(item?.photo_url || null, item?.emoji || '🍽️');

  const rows = document.getElementById('menuRecipeRows');
  rows.innerHTML = '';
  const recipe = item?.recipe || [];
  if (recipe.length === 0) addMenuRecipeRow();
  else recipe.forEach(r => addMenuRecipeRow({
    ingredient_id: r.ingredient_id,
    quantity: r.quantity,
    unit: r.recipe_unit || 'ml',
  }));

  document.getElementById('menuEditorDeleteBtn').hidden = !item;
  cancelNewModifierGroupForm();

  document.getElementById('menuEditorOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('menuF_code').focus(), 50);
  updateMenuCostPreview();
  renderMenuOptionGroups();

  // Load already-attached group ids for this item (only when editing existing)
  if (item && item.id) {
    try {
      const r = await apiFetch(`/api/admin/menu/items/${item.id}/modifier-groups`, { headers: hdr() });
      if (r.ok) {
        const j = await r.json();
        menuState.itemGroupIds = Array.isArray(j.group_ids) ? j.group_ids.slice() : [];
        renderMenuOptionGroups();
      }
    } catch (_) { /* non-fatal */ }
  }
}

function closeMenuEditor() {
  document.getElementById('menuEditorOverlay').classList.add('hidden');
  menuState.editing = null;
  menuState.itemGroupIds = [];
  menuState.pendingPhotoFile = null;
  menuState.pendingPhotoRemove = false;
  cancelNewModifierGroupForm();
}

// ── Menu photo (preview / pick / remove; upload happens on Save) ─────────────

function _renderMenuPhotoPreview(photoUrl, emojiFallback) {
  const wrap = document.getElementById('menuF_photoPreview');
  const removeBtn = document.getElementById('menuF_photoRemoveBtn');
  if (!wrap) return;
  if (photoUrl) {
    wrap.innerHTML = `<img src="${esc(photoUrl)}" alt="">`;
    wrap.classList.add('has-photo');
    if (removeBtn) removeBtn.hidden = false;
  } else {
    wrap.innerHTML = `<span class="menu-photo-placeholder">${esc(emojiFallback || '🍽️')}</span>`;
    wrap.classList.remove('has-photo');
    if (removeBtn) removeBtn.hidden = true;
  }
}

function onMenuPhotoSelected(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    alert('Unsupported file type. Use PNG, JPEG, or WebP.');
    ev.target.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large (max 5MB).');
    ev.target.value = '';
    return;
  }
  menuState.pendingPhotoFile = file;
  menuState.pendingPhotoRemove = false;
  const url = URL.createObjectURL(file);
  _renderMenuPhotoPreview(url, document.getElementById('menuF_emoji').value);
}

function removeMenuPhoto() {
  menuState.pendingPhotoFile = null;
  menuState.pendingPhotoRemove = true;
  document.getElementById('menuF_photoFile').value = '';
  _renderMenuPhotoPreview(null, document.getElementById('menuF_emoji').value);
}

async function _flushMenuPhotoTo(itemId) {
  if (!itemId) return;
  if (menuState.pendingPhotoFile) {
    const fd = new FormData();
    fd.append('photo', menuState.pendingPhotoFile);
    // Note: don't set Content-Type so the browser supplies the multipart boundary.
    const res = await fetch(`/api/admin/menu/items/${itemId}/photo`, {
      method: 'POST',
      headers: { 'x-auth-token': token },
      body: fd,
    });
    if (res.status === 401) { await doLogout(); throw new Error('unauthorized'); }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `photo upload failed (${res.status})`);
    }
  } else if (menuState.pendingPhotoRemove) {
    await apiFetch(`/api/admin/menu/items/${itemId}/photo`, {
      method: 'DELETE', headers: hdr(),
    });
  }
}

function addMenuRecipeRow(initial) {
  const container = document.getElementById('menuRecipeRows');
  const row = document.createElement('div');
  row.className = 'menu-recipe-row';

  // searchable ingredient picker (mirrors addRecipeRow pattern, hidden .mr-ing keeps id)
  const wrap = document.createElement('div');
  wrap.className = 'ing-search-wrap';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ing-search-input';
  searchInput.autocomplete = 'off';
  searchInput.placeholder = (typeof t === 'function' ? t('opt_select_ing_lbl') : null) || 'Search ingredient…';
  const hiddenId = document.createElement('input');
  hiddenId.type = 'hidden';
  hiddenId.className = 'mr-ing';
  const dropdown = document.createElement('div');
  dropdown.className = 'ing-dropdown';

  function renderDropdown(query) {
    const q = (query || '').toLowerCase();
    const list = menuState.ingredients || [];
    const filtered = q
      ? list.filter(i =>
          (i.name_ko || '').toLowerCase().includes(q) ||
          (i.name_ar || '').includes(query) ||
          (i.unit || '').toLowerCase().includes(q)
        )
      : list;
    dropdown.innerHTML = '';
    if (!filtered.length) {
      dropdown.innerHTML = `<div class="ing-no-result">no result</div>`;
    } else {
      filtered.forEach(i => {
        const item = document.createElement('div');
        item.className = 'ing-dropdown-item';
        const label = i.name_ko || i.name_ar || `#${i.id}`;
        item.innerHTML = `<span class="ing-name">${esc(label)}</span><span class="ing-unit">${esc(i.unit || '')}</span>`;
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          searchInput.value = `${label} (${i.unit || ''})`;
          searchInput.classList.add('selected');
          hiddenId.value = i.id;
          dropdown.classList.remove('open');
          updateMenuCostPreview();
        });
        dropdown.appendChild(item);
      });
    }
    dropdown.classList.add('open');
  }

  searchInput.addEventListener('focus', () => renderDropdown(searchInput.value));
  searchInput.addEventListener('input', () => {
    hiddenId.value = '';
    searchInput.classList.remove('selected');
    renderDropdown(searchInput.value);
    updateMenuCostPreview();
  });
  searchInput.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.remove('open'), 150);
  });
  searchInput.addEventListener('keydown', e => {
    const items = [...dropdown.querySelectorAll('.ing-dropdown-item')];
    const active = dropdown.querySelector('.ing-dropdown-item.active');
    let idx = items.indexOf(active);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (active) active.classList.remove('active');
      items[(idx + 1) % items.length]?.classList.add('active');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (active) active.classList.remove('active');
      items[(idx - 1 + items.length) % items.length]?.classList.add('active');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active) active.dispatchEvent(new MouseEvent('mousedown'));
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('open');
    }
  });

  wrap.appendChild(searchInput);
  wrap.appendChild(hiddenId);
  wrap.appendChild(dropdown);

  // qty + unit + remove
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.className = 'mr-qty';
  qtyInput.min = 0;
  qtyInput.step = 0.1;
  qtyInput.placeholder = 'qty';

  const unitSel = document.createElement('select');
  unitSel.className = 'mr-unit';
  ['ml', 'g'].forEach(u => {
    const opt = document.createElement('option');
    opt.value = u; opt.textContent = u;
    unitSel.appendChild(opt);
  });

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn btn-danger btn-sm';
  delBtn.setAttribute('aria-label', 'Remove');
  delBtn.textContent = '×';
  delBtn.addEventListener('click', () => {
    row.remove();
    updateMenuCostPreview();
  });

  // Pre-fill if editing an existing recipe row
  if (initial) {
    const existing = (menuState.ingredients || []).find(i => i.id === initial.ingredient_id);
    if (existing) {
      const label = existing.name_ko || existing.name_ar || `#${existing.id}`;
      searchInput.value = `${label} (${existing.unit || ''})`;
      searchInput.classList.add('selected');
      hiddenId.value = existing.id;
    }
    qtyInput.value = initial.quantity;
    unitSel.value = initial.unit === 'g' ? 'g' : 'ml';
  }

  qtyInput.addEventListener('input', updateMenuCostPreview);
  unitSel.addEventListener('change', updateMenuCostPreview);

  row.appendChild(wrap);
  row.appendChild(qtyInput);
  row.appendChild(unitSel);
  row.appendChild(delBtn);
  container.appendChild(row);
}

function _readMenuRecipeRows() {
  const out = [];
  document.querySelectorAll('#menuRecipeRows .menu-recipe-row').forEach(row => {
    const ingId = parseInt(row.querySelector('.mr-ing').value, 10);
    const qty = parseFloat(row.querySelector('.mr-qty').value);
    const unit = row.querySelector('.mr-unit').value === 'g' ? 'g' : 'ml';
    if (Number.isFinite(ingId) && Number.isFinite(qty) && qty > 0) {
      out.push({ ingredient_id: ingId, quantity: qty, unit });
    }
  });
  return out;
}

function updateMenuCostPreview() {
  const items = _readMenuRecipeRows();
  let total = 0;
  for (const r of items) {
    const ing = menuState.ingredients.find(i => i.id === r.ingredient_id);
    if (!ing) continue;
    const cap = Number(ing.capacity_ml) || 0;
    const cpu = Number(ing.cost_per_unit) || 0;
    const unitCost = cap > 0 ? cpu / cap : cpu;
    total += r.quantity * unitCost;
  }
  const el = document.getElementById('menuRecipeCostValue');
  if (el) el.textContent = `${fmtIqd(total)} IQD`;
}

async function saveMenuEditor() {
  const code = document.getElementById('menuF_code').value.trim();
  const name_en = document.getElementById('menuF_name_en').value.trim();
  const name_ar = document.getElementById('menuF_name_ar').value.trim();
  const emoji = document.getElementById('menuF_emoji').value.trim();
  const base_price = Number(document.getElementById('menuF_price').value);
  const kind = document.getElementById('menuF_kind').value === 'set' ? 'set' : 'single';
  const sort_order = Number(document.getElementById('menuF_sort').value) || 100;
  const description = document.getElementById('menuF_desc').value.trim();
  const active = document.getElementById('menuF_active').checked;
  const is_new       = document.getElementById('menuF_is_new').checked;
  const is_best      = document.getElementById('menuF_is_best').checked;
  const is_signature = document.getElementById('menuF_is_signature').checked;
  const catSel = document.getElementById('menuF_category').value;
  const category_id = catSel ? parseInt(catSel, 10) : null;

  if (!/^[A-Za-z0-9_]{2,32}$/.test(code))
    return alert('Code must be 2–32 chars: letters, digits, underscore.');
  if (!name_en) return alert('Name (EN) is required.');
  if (!Number.isFinite(base_price) || base_price < 0) return alert('Invalid price.');

  const payload = { code, name_en, name_ar, emoji: emoji || null,
    category_id, base_price, kind, sort_order, description: description || null, active,
    is_new, is_best, is_signature };

  const editing = menuState.editing;
  try {
    let id;
    if (editing && editing.id) {
      const r = await apiFetch(`/api/admin/menu/items/${editing.id}`, {
        method: 'PUT', headers: hdr(), body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return alert(j.error || 'save_failed');
      id = editing.id;
    } else {
      const r = await apiFetch('/api/admin/menu/items', {
        method: 'POST', headers: hdr(), body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return alert(j.error || 'save_failed');
      id = j.id;
    }

    // Save recipe — replace or clear
    const recipeItems = _readMenuRecipeRows();
    if (recipeItems.length > 0) {
      const cat = menuState.categories.find(c => c.id === category_id);
      const menu_category = cat ? (cat.name_ko || cat.name_en || cat.code) : '기타';
      const rr = await apiFetch('/api/recipes', {
        method: 'POST', headers: hdr(),
        body: JSON.stringify({ menu_item_id: id, menu_item: name_en, items: recipeItems, menu_category }),
      });
      if (!rr.ok) {
        const rj = await rr.json().catch(() => ({}));
        alert('Saved menu but recipe failed: ' + (rj.error || rr.status));
      }
    } else if (editing && editing.id) {
      // user cleared all rows — drop existing recipe
      await apiFetch(`/api/recipes/by-id/${editing.id}`, { method: 'DELETE', headers: hdr() });
    }

    // Save modifier-group attachments (canonical: read current checkbox state)
    const checkedGroupIds = _readCheckedModifierGroupIds();
    try {
      const gr = await apiFetch(`/api/admin/menu/items/${id}/modifier-groups`, {
        method: 'PUT', headers: hdr(),
        body: JSON.stringify({ group_ids: checkedGroupIds }),
      });
      if (!gr.ok) {
        const gj = await gr.json().catch(() => ({}));
        alert('Saved menu but option groups failed: ' + (gj.error || gr.status));
      }
    } catch (_) { /* non-fatal */ }

    // Save photo (multipart upload or DELETE)
    try {
      await _flushMenuPhotoTo(id);
    } catch (e) {
      if (e?.message === 'unauthorized') return;
      alert('Saved menu but photo failed: ' + (e.message || 'upload error'));
    }

    closeMenuEditor();
    await loadMenuTab();
  } catch (e) {
    if (e?.message === 'unauthorized') return;
    alert(e.message || 'save_failed');
  }
}

// ── Option groups in menu editor ──────────────────────────────────────────────

function _readCheckedModifierGroupIds() {
  const out = [];
  document.querySelectorAll('#menuOptionGroupsList .menu-modgroup-row input.mg-toggle:checked').forEach(cb => {
    const id = parseInt(cb.value, 10);
    if (Number.isFinite(id)) out.push(id);
  });
  return out;
}

function renderMenuOptionGroups() {
  const root = document.getElementById('menuOptionGroupsList');
  if (!root) return;
  const checkedSet = new Set(menuState.itemGroupIds || []);
  if (!menuState.modifierGroups.length) {
    root.innerHTML = `<div style="color:var(--soft);font-size:.83rem;padding:.5rem 0">No option groups yet — click "+ New group" above.</div>`;
    return;
  }
  root.innerHTML = menuState.modifierGroups.map(g => menuModGroupRowHtml(g, checkedSet.has(g.id))).join('');
  // bind toggle handlers (purely UI; persisted on Save)
  root.querySelectorAll('input.mg-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = parseInt(cb.value, 10);
      const set = new Set(menuState.itemGroupIds);
      if (cb.checked) set.add(id); else set.delete(id);
      menuState.itemGroupIds = [...set];
    });
  });
}

function menuModGroupRowHtml(g, checked) {
  const lang = currentLang;
  const name = lang === 'ar' ? (g.name_ar || g.name_en) : (g.name_en || g.name_ko || g.code);
  const sel = g.selection === 'multi' ? 'multi' : 'single';
  const req = g.required ? '<span class="mg-pill mg-pill-required">required</span>' : '';
  const optsHtml = (g.options || []).map(o => menuModOptRowHtml(o)).join('');
  return `
    <div class="menu-modgroup-row" data-group-id="${g.id}">
      <header>
        <label class="mg-check">
          <input type="checkbox" class="mg-toggle" value="${g.id}" ${checked ? 'checked' : ''}>
          <span class="mg-name">${esc(name)}</span>
        </label>
        <code class="mg-code">${esc(g.code)}</code>
        <span class="mg-pill mg-pill-${sel}">${sel}</span>
        ${req}
      </header>
      <div class="menu-modopts">${optsHtml || '<div class="mg-empty">no options yet</div>'}</div>
      <div class="menu-modopt-newrow">
        <input class="mo-new-code"    placeholder="code (e.g. vanilla)" maxlength="32">
        <input class="mo-new-name-en" placeholder="Name (EN)" maxlength="80">
        <input class="mo-new-name-ar" class="ar" dir="rtl" placeholder="Name (AR)" maxlength="80">
        <input class="mo-new-delta"   type="number" placeholder="±IQD" step="100">
        <button class="btn btn-outline btn-sm" type="button" onclick="addOptionToGroup(${g.id}, this)">+ Add</button>
      </div>
    </div>
  `;
}

function menuModOptRowHtml(o) {
  const lang = currentLang;
  const name = lang === 'ar' ? (o.name_ar || o.name_en) : (o.name_en || o.name_ko || o.code);
  const delta = Number(o.price_delta_iqd) || 0;
  return `
    <div class="menu-modopt-row" data-option-id="${o.id}">
      <span class="mo-name">${esc(name)} <code>${esc(o.code)}</code></span>
      <input class="mo-delta" type="number" step="100" value="${delta}" onchange="updateOptionDelta(${o.id}, this.value)">
      <span class="mo-iqd">IQD</span>
      <button class="btn btn-danger btn-sm" type="button" onclick="removeOption(${o.id})" aria-label="Remove">×</button>
    </div>
  `;
}

function openNewModifierGroupForm() {
  const f = document.getElementById('newOptGroupForm');
  if (!f) return;
  f.classList.remove('hidden');
  ['newOG_code','newOG_name_en','newOG_name_ar'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('newOG_selection').value = 'single';
  document.getElementById('newOG_required').checked = false;
  document.getElementById('newOG_code').focus();
}

function cancelNewModifierGroupForm() {
  const f = document.getElementById('newOptGroupForm');
  if (f) f.classList.add('hidden');
}

async function submitNewModifierGroup() {
  const code = document.getElementById('newOG_code').value.trim().toLowerCase();
  const name_en = document.getElementById('newOG_name_en').value.trim();
  const name_ar = document.getElementById('newOG_name_ar').value.trim();
  const selection = document.getElementById('newOG_selection').value === 'multi' ? 'multi' : 'single';
  const required = document.getElementById('newOG_required').checked ? 1 : 0;
  if (!/^[a-z0-9_]{2,32}$/.test(code)) return alert('Code must be 2–32 chars: lowercase letters, digits, underscore.');
  if (!name_en) return alert('Name (EN) is required.');
  try {
    const r = await apiFetch('/api/admin/menu/modifier-groups', {
      method: 'POST', headers: hdr(),
      body: JSON.stringify({ code, name_en, name_ar, selection, required }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return alert(j.error || 'create_failed');
    cancelNewModifierGroupForm();
    await reloadModifierGroups();
    // auto-attach the newly-created group to the editing item (UI level)
    if (j.id) {
      const set = new Set(menuState.itemGroupIds);
      set.add(j.id);
      menuState.itemGroupIds = [...set];
      renderMenuOptionGroups();
    }
  } catch (e) {
    if (e?.message === 'unauthorized') return;
    alert(e.message || 'failed');
  }
}

async function reloadModifierGroups() {
  try {
    const gRes = await apiFetch('/api/admin/menu/modifier-groups', { headers: hdr() });
    if (gRes.ok) menuState.modifierGroups = await gRes.json();
    renderMenuOptionGroups();
  } catch (_) { /* non-fatal */ }
}

async function addOptionToGroup(groupId, btn) {
  const row = btn.closest('.menu-modgroup-row');
  const code = row.querySelector('.mo-new-code').value.trim().toLowerCase();
  const name_en = row.querySelector('.mo-new-name-en').value.trim();
  const name_ar = row.querySelector('.mo-new-name-ar').value.trim();
  const delta = parseInt(row.querySelector('.mo-new-delta').value, 10);
  if (!/^[a-z0-9_]{1,32}$/.test(code)) return alert('Option code must be 1–32 chars: lowercase letters, digits, underscore.');
  if (!name_en) return alert('Name (EN) is required.');
  const price_delta_iqd = Number.isFinite(delta) ? delta : 0;
  try {
    const r = await apiFetch(`/api/admin/menu/modifier-groups/${groupId}/options`, {
      method: 'POST', headers: hdr(),
      body: JSON.stringify({ code, name_en, name_ar, price_delta_iqd }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return alert(j.error || 'create_failed');
    await reloadModifierGroups();
  } catch (e) {
    if (e?.message === 'unauthorized') return;
    alert(e.message || 'failed');
  }
}

async function updateOptionDelta(optionId, raw) {
  const v = parseInt(raw, 10);
  if (!Number.isFinite(v)) return;
  try {
    const r = await apiFetch(`/api/admin/menu/modifier-options/${optionId}`, {
      method: 'PUT', headers: hdr(),
      body: JSON.stringify({ price_delta_iqd: v }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || 'update_failed');
    } else {
      // Mirror change locally so it survives until next reload.
      for (const g of menuState.modifierGroups) {
        const o = (g.options || []).find(x => x.id === optionId);
        if (o) { o.price_delta_iqd = v; break; }
      }
    }
  } catch (e) {
    if (e?.message === 'unauthorized') return;
    alert(e.message || 'failed');
  }
}

async function removeOption(optionId) {
  if (!confirm('Remove this option?')) return;
  try {
    const r = await apiFetch(`/api/admin/menu/modifier-options/${optionId}`, {
      method: 'DELETE', headers: hdr(),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      return alert(j.error || 'delete_failed');
    }
    await reloadModifierGroups();
  } catch (e) {
    if (e?.message === 'unauthorized') return;
    alert(e.message || 'failed');
  }
}

async function deleteMenuItem() {
  const editing = menuState.editing;
  if (!editing || !editing.id) return;
  if (!confirm('Deactivate this menu item? It will be hidden from POS and the website but kept in history.')) return;
  try {
    const r = await apiFetch(`/api/admin/menu/items/${editing.id}`, {
      method: 'PUT', headers: hdr(), body: JSON.stringify({ active: false }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return alert(j.error || 'failed');
    closeMenuEditor();
    await loadMenuTab();
  } catch (e) {
    if (e?.message === 'unauthorized') return;
    alert(e.message || 'failed');
  }
}

// ══════════════════════════════════════════════
// Menu Options (modifier groups) — required toggle
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// Menu Options tab — modifier groups + options
// (full CRUD + drag-and-drop, server-backed)
// ══════════════════════════════════════════════
let modGroupsCache = [];   // [{ id, code, name_en, name_ar, selection, required, options: [...] }, ...]
let editingModGroupId = null;
let editingModOptId = null;
let editingModOptGroupId = null;

async function loadOptionsTab() {
  const box = document.getElementById('optionGroupsList');
  if (!box) return;
  box.textContent = t('loading') || 'Loading…';
  try {
    const resp = await apiFetch('/api/admin/menu/modifier-groups', { headers: hdr() });
    if (!resp.ok) { box.textContent = t('modgrp_err_load'); return; }
    modGroupsCache = await resp.json();
    renderOptionsTab();
  } catch (e) {
    box.textContent = (t('modgrp_err_load')) + ': ' + (e?.message || 'unknown');
  }
}

function renderOptionsTab() {
  const box = document.getElementById('optionGroupsList');
  if (!box) return;
  const groups = [...modGroupsCache].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  if (!groups.length) {
    box.innerHTML = `<p style="color:var(--soft);font-size:.85rem">${t('modgrp_empty')}</p>`;
    return;
  }
  box.innerHTML = `<div id="modGroupsSortable" class="sortable-list">${groups.map((g, gi) => {
    const opts = [...(g.options || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const selKind = g.selection === 'multi' ? t('modgrp_multi') : t('modgrp_single');
    return `<div class="card sortable-item" draggable="true" data-sid="${g.id}" style="flex-direction:column;align-items:stretch;padding:.65rem .85rem">
      <div style="display:flex;align-items:center;gap:.5rem;width:100%">
        <span class="sortable-handle" title="Drag to reorder">⋮⋮</span>
        <button class="sortable-arrow" ${gi === 0 ? 'disabled' : ''} onclick="moveModGroup(${g.id}, -1)" aria-label="Up">▲</button>
        <button class="sortable-arrow" ${gi === groups.length - 1 ? 'disabled' : ''} onclick="moveModGroup(${g.id}, 1)" aria-label="Down">▼</button>
        <strong style="font-size:.95rem">${esc(g.name_en || g.code)}</strong>
        ${g.name_ar ? `<span class="ar" dir="rtl" style="color:var(--soft);font-size:.82rem">${esc(g.name_ar)}</span>` : ''}
        <span style="font-size:.7rem;color:var(--soft);font-family:ui-monospace,monospace">${esc(g.code)}</span>
        <span style="font-size:.72rem;color:var(--soft)">· ${selKind}${g.required ? ' · ' + t('modgrp_required') : ''}</span>
        <span style="flex:1"></span>
        <label style="display:inline-flex;align-items:center;gap:.3rem;font-size:.76rem;color:var(--mid);cursor:pointer">
          <input type="checkbox" ${g.required ? 'checked' : ''} onchange="toggleModifierRequired(${g.id}, this.checked, this)">
          <span data-i18n="modgrp_required">Required</span>
        </label>
        <button class="btn btn-outline btn-sm" style="padding:.18rem .5rem" onclick="openModGroupModal(${g.id})">✎</button>
        <button class="btn btn-danger btn-sm" style="padding:.18rem .5rem" onclick="deleteModGroup(${g.id})">✕</button>
      </div>
      <div style="margin-top:.45rem;padding-top:.45rem;border-top:1px dashed #e3e7e4">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.3rem">
          <span style="font-size:.74rem;color:var(--soft)">${opts.length} ${t('modopt_count_label')}</span>
          <button class="btn btn-outline btn-sm" style="padding:.15rem .5rem;font-size:.7rem" onclick="openModOptModal(${g.id})">+ ${t('modopt_btn_add')}</button>
        </div>
        ${opts.length ? `<div class="sortable-list" data-options-of="${g.id}">${opts.map((o, oi) => {
          const delta = Number(o.price_delta_iqd || 0);
          const deltaTxt = delta ? ` <span style="font-weight:700;color:${delta > 0 ? 'var(--green)' : 'var(--red)'}">${delta > 0 ? '+' : ''}${delta.toLocaleString()} IQD</span>` : '';
          return `<div class="sortable-item" draggable="true" data-sid="${o.id}" style="padding:.32rem .5rem;font-size:.78rem">
            <span class="sortable-handle" title="Drag to reorder">⋮⋮</span>
            <button class="sortable-arrow" ${oi === 0 ? 'disabled' : ''} onclick="moveModOpt(${g.id}, ${o.id}, -1)" aria-label="Up">▲</button>
            <button class="sortable-arrow" ${oi === opts.length - 1 ? 'disabled' : ''} onclick="moveModOpt(${g.id}, ${o.id}, 1)" aria-label="Down">▼</button>
            <span class="grow">
              <b>${esc(o.name_en || o.code)}</b>
              ${o.name_ar ? `<span class="ar" dir="rtl" style="margin-inline-start:.3rem;color:var(--soft)">${esc(o.name_ar)}</span>` : ''}
              <span style="margin-inline-start:.3rem;font-size:.7rem;color:var(--soft);font-family:ui-monospace,monospace">${esc(o.code)}</span>
              ${deltaTxt}
              ${o.is_default ? ` <span style="font-size:.68rem;color:var(--green);font-weight:700">★ default</span>` : ''}
            </span>
            <button class="btn btn-outline btn-sm" style="padding:.1rem .4rem" onclick="openModOptModal(${g.id}, ${o.id})">✎</button>
            <button class="btn btn-danger btn-sm" style="padding:.1rem .4rem" onclick="deleteModOpt(${g.id}, ${o.id})">✕</button>
          </div>`;
        }).join('')}</div>` : `<p style="font-size:.74rem;color:var(--soft);margin:.2rem 0">${t('modopt_empty')}</p>`}
      </div>
    </div>`;
  }).join('')}</div>`;

  // wire drag for groups
  attachSortable(document.getElementById('modGroupsSortable'), persistModGroupOrder);
  // wire drag for each group's options list
  groups.forEach(g => {
    const c = document.querySelector(`[data-options-of="${g.id}"]`);
    if (c) attachSortable(c, order => persistModOptOrder(g.id, order));
  });
}

async function persistModGroupOrder(order) {
  const res = await apiFetch('/api/admin/menu/modifier-groups/reorder', {
    method: 'PUT', headers: hdr(), body: JSON.stringify({ order })
  });
  if (!res.ok) {
    alert(t('modgrp_err_reorder'));
    return;
  }
  order.forEach((id, idx) => {
    const g = modGroupsCache.find(x => x.id === id);
    if (g) g.sort_order = (idx + 1) * 100;
  });
}

async function persistModOptOrder(gid, order) {
  const res = await apiFetch(`/api/admin/menu/modifier-groups/${gid}/options/reorder`, {
    method: 'PUT', headers: hdr(), body: JSON.stringify({ order })
  });
  if (!res.ok) {
    alert(t('modopt_err_reorder'));
    return;
  }
  const g = modGroupsCache.find(x => x.id === gid);
  if (g && Array.isArray(g.options)) {
    order.forEach((id, idx) => {
      const o = g.options.find(x => x.id === id);
      if (o) o.sort_order = (idx + 1) * 100;
    });
  }
}

function moveModGroup(id, dir) {
  const c = document.getElementById('modGroupsSortable');
  if (!c) return;
  sortableMove(c, id, dir, persistModGroupOrder);
  setTimeout(renderOptionsTab, 100);
}

function moveModOpt(gid, oid, dir) {
  const c = document.querySelector(`[data-options-of="${gid}"]`);
  if (!c) return;
  sortableMove(c, oid, dir, order => persistModOptOrder(gid, order));
  setTimeout(renderOptionsTab, 100);
}

// ── Group modal ──
function openModGroupModal(id) {
  editingModGroupId = id || null;
  document.getElementById('modGroupModalTitle').textContent = id ? t('modgrp_title_edit') : t('modgrp_title_add');
  const code  = document.getElementById('modGroupCode');
  const nameEn = document.getElementById('modGroupNameEn');
  const nameAr = document.getElementById('modGroupNameAr');
  const sel = document.getElementById('modGroupSelection');
  const req = document.getElementById('modGroupRequired');
  document.getElementById('modGroupErr').textContent = '';
  if (id) {
    const g = modGroupsCache.find(x => x.id === id);
    code.value = g?.code || '';
    code.disabled = true;
    nameEn.value = g?.name_en || '';
    nameAr.value = g?.name_ar || '';
    sel.value = g?.selection === 'multi' ? 'multi' : 'single';
    req.checked = !!g?.required;
  } else {
    code.value = ''; code.disabled = false;
    nameEn.value = ''; nameAr.value = '';
    sel.value = 'single'; req.checked = false;
  }
  document.getElementById('modGroupModal').classList.remove('hidden');
}

async function submitModGroupForm() {
  const errEl = document.getElementById('modGroupErr');
  const code = document.getElementById('modGroupCode').value.trim().toLowerCase();
  const name_en = document.getElementById('modGroupNameEn').value.trim();
  const name_ar = document.getElementById('modGroupNameAr').value.trim();
  const selection = document.getElementById('modGroupSelection').value;
  const required = document.getElementById('modGroupRequired').checked;
  errEl.textContent = '';
  if (!editingModGroupId && !/^[a-z0-9_]{2,32}$/.test(code)) { errEl.textContent = t('modgrp_err_code'); return; }
  if (!name_en) { errEl.textContent = t('menucat_err_name_en'); return; }
  if (!name_ar) { errEl.textContent = t('menucat_err_name_ar'); return; }
  lockBtn('modGroupSaveBtn');
  try {
    const url = editingModGroupId
      ? `/api/admin/menu/modifier-groups/${editingModGroupId}`
      : `/api/admin/menu/modifier-groups`;
    const method = editingModGroupId ? 'PUT' : 'POST';
    const body = editingModGroupId
      ? { name_en, name_ar, selection, required: required ? 1 : 0 }
      : { code, name_en, name_ar, selection, required: required ? 1 : 0, sort_order: (modGroupsCache.length + 1) * 100 };
    const r = await apiFetch(url, { method, headers: hdr(), body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.success) {
      const key = j.error === 'code_exists' ? 'menucat_err_dup' : 'modgrp_err_save';
      errEl.textContent = t(key);
      return;
    }
    closeModal('modGroupModal');
    await loadOptionsTab();
  } finally {
    unlockBtn('modGroupSaveBtn');
  }
}

async function deleteModGroup(id) {
  const g = modGroupsCache.find(x => x.id === id);
  if (!g) return;
  if (!confirm(t('modgrp_confirm_del').replace('${name}', g.name_en || g.code))) return;
  const r = await apiFetch(`/api/admin/menu/modifier-groups/${id}`, { method: 'DELETE', headers: hdr() });
  if (r.status === 409) {
    const j = await r.json().catch(() => ({}));
    alert(t('modgrp_err_in_use').replace('${count}', String(j.items || '?')));
    return;
  }
  if (!r.ok) { alert(t('modgrp_err_delete')); return; }
  await loadOptionsTab();
}

// ── Option modal ──
function openModOptModal(gid, optId) {
  editingModOptGroupId = gid;
  editingModOptId = optId || null;
  document.getElementById('modOptModalTitle').textContent = optId ? t('modopt_title_edit') : t('modopt_title_add');
  const code = document.getElementById('modOptCode');
  const nameEn = document.getElementById('modOptNameEn');
  const nameAr = document.getElementById('modOptNameAr');
  const price = document.getElementById('modOptPriceDelta');
  const isDef = document.getElementById('modOptIsDefault');
  document.getElementById('modOptErr').textContent = '';
  if (optId) {
    const g = modGroupsCache.find(x => x.id === gid);
    const o = g?.options?.find(x => x.id === optId);
    code.value = o?.code || '';
    code.disabled = true;
    nameEn.value = o?.name_en || '';
    nameAr.value = o?.name_ar || '';
    price.value = String(o?.price_delta_iqd ?? 0);
    isDef.checked = !!o?.is_default;
  } else {
    code.value = ''; code.disabled = false;
    nameEn.value = ''; nameAr.value = '';
    price.value = '0'; isDef.checked = false;
  }
  document.getElementById('modOptModal').classList.remove('hidden');
}

async function submitModOptForm() {
  const errEl = document.getElementById('modOptErr');
  const code = document.getElementById('modOptCode').value.trim().toLowerCase();
  const name_en = document.getElementById('modOptNameEn').value.trim();
  const name_ar = document.getElementById('modOptNameAr').value.trim();
  const price_delta_iqd = parseInt(document.getElementById('modOptPriceDelta').value, 10) || 0;
  const is_default = document.getElementById('modOptIsDefault').checked;
  errEl.textContent = '';
  if (!editingModOptId && !/^[a-z0-9_]{1,32}$/.test(code)) { errEl.textContent = t('modopt_err_code'); return; }
  if (!name_en) { errEl.textContent = t('menucat_err_name_en'); return; }
  lockBtn('modOptSaveBtn');
  try {
    let url, method, body;
    if (editingModOptId) {
      url = `/api/admin/menu/modifier-options/${editingModOptId}`;
      method = 'PUT';
      body = { name_en, name_ar, price_delta_iqd, is_default: is_default ? 1 : 0 };
    } else {
      url = `/api/admin/menu/modifier-groups/${editingModOptGroupId}/options`;
      method = 'POST';
      const g = modGroupsCache.find(x => x.id === editingModOptGroupId);
      const nextSort = ((g?.options?.length || 0) + 1) * 100;
      body = { code, name_en, name_ar, price_delta_iqd, is_default: is_default ? 1 : 0, sort_order: nextSort };
    }
    const r = await apiFetch(url, { method, headers: hdr(), body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.success) {
      const key = j.error === 'code_exists' ? 'menucat_err_dup' : 'modopt_err_save';
      errEl.textContent = t(key);
      return;
    }
    closeModal('modOptModal');
    await loadOptionsTab();
  } finally {
    unlockBtn('modOptSaveBtn');
  }
}

async function deleteModOpt(gid, oid) {
  const g = modGroupsCache.find(x => x.id === gid);
  const o = g?.options?.find(x => x.id === oid);
  if (!o) return;
  if (!confirm(t('modopt_confirm_del').replace('${name}', o.name_en || o.code))) return;
  const r = await apiFetch(`/api/admin/menu/modifier-options/${oid}`, { method: 'DELETE', headers: hdr() });
  if (!r.ok) { alert(t('modopt_err_delete')); return; }
  await loadOptionsTab();
}

async function toggleModifierRequired(groupId, isRequired, checkboxEl) {
  if (checkboxEl) checkboxEl.disabled = true;
  try {
    const resp = await apiFetch(`/api/admin/menu/modifier-groups/${groupId}`, {
      method: 'PUT', headers: hdr(),
      body: JSON.stringify({ required: isRequired ? 1 : 0 })
    });
    if (!resp.ok) {
      alert(t('modgrp_err_save'));
      if (checkboxEl) checkboxEl.checked = !isRequired;
    } else {
      const g = modGroupsCache.find(x => x.id === groupId);
      if (g) g.required = isRequired ? 1 : 0;
    }
  } catch (e) {
    alert(t('modgrp_err_save'));
    if (checkboxEl) checkboxEl.checked = !isRequired;
  } finally {
    if (checkboxEl) checkboxEl.disabled = false;
  }
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ══════════════════════════════════════════════
// 시작
// ══════════════════════════════════════════════
applyLang(currentLang);
if (token) {
  document.getElementById('loginOverlay').style.display = 'none';
  init();
}
