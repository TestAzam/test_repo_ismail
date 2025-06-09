-- Seed data for Asset Management Platform
-- Test data for Result Education company

-- ==========================================
-- COMPANY DATA
-- ==========================================

-- Insert Result Education company
INSERT INTO companies (name, inn, email, address) VALUES 
('Result Education', '7743013902', 'info@result-education.ru', 'г. Ташкент, ул. Шота Руставели, д. 10');

-- Get company ID for reference
-- In real application, this would be handled programmatically
-- For seed data, we assume company_id = 1

-- ==========================================
-- USERS DATA
-- ==========================================

-- Insert admin user (password: admin123)
INSERT INTO users (email, username, hashed_password, role, company_id) VALUES 
('admin@result-education.ru', 'Администратор', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Admin', 1);

-- Insert accountant user (password: accountant123)
INSERT INTO users (email, username, hashed_password, role, company_id) VALUES 
('accountant@result-education.ru', 'Главный бухгалтер', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Accountant', 1);

-- Insert warehouse keeper user (password: warehouse123)
INSERT INTO users (email, username, hashed_password, role, company_id) VALUES 
('warehouse@result-education.ru', 'Кладовщик', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Warehouse_keeper', 1);

-- Insert observer user (password: observer123)
INSERT INTO users (email, username, hashed_password, role, company_id) VALUES 
('observer@result-education.ru', 'Наблюдатель', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Observer', 1);

-- ==========================================
-- BRANCHES DATA
-- ==========================================

-- Main office in Tashkent
INSERT INTO branches (name, address, company_id) VALUES 
('Головной офис', 'г. Ташкент, ул. Шота Руставели, д. 10', 1);

-- Branch in Samarkand
INSERT INTO branches (name, address, company_id) VALUES 
('Филиал Самарканд', 'г. Самарканд, ул. Регистан, д. 25', 1);

-- Branch in Bukhara
INSERT INTO branches (name, address, company_id) VALUES 
('Филиал Бухара', 'г. Бухара, ул. Ляби-Хауз, д. 15', 1);

-- ==========================================
-- WAREHOUSES DATA
-- ==========================================

-- Warehouses for main office
INSERT INTO warehouses (name, address, branch_id) VALUES 
('Склад оборудования (Главный офис)', 'г. Ташкент, ул. Шота Руставели, д. 10, подвал', 1),
('Склад материалов (Главный офис)', 'г. Ташкент, ул. Шота Руставели, д. 10, 1 этаж', 1);

-- Warehouses for Samarkand branch
INSERT INTO warehouses (name, address, branch_id) VALUES 
('Склад оборудования (Самарканд)', 'г. Самарканд, ул. Регистан, д. 25, склад', 2),
('Склад материалов (Самарканд)', 'г. Самарканд, ул. Регистан, д. 25, кабинет 101', 2);

-- Warehouses for Bukhara branch
INSERT INTO warehouses (name, address, branch_id) VALUES 
('Склад оборудования (Бухара)', 'г. Бухара, ул. Ляби-Хауз, д. 15, склад', 3),
('Склад учебных материалов (Бухара)', 'г. Бухара, ул. Ляби-Хауз, д. 15, кабинет 205', 3);

-- ==========================================
-- ASSETS DATA - FIXED ASSETS
-- ==========================================

-- Computers and IT equipment
INSERT INTO assets (inventory_number, name, description, category, cost, quantity, status, warehouse_id, serial_number, purchase_date, supplier, notes) VALUES 
('INV-20250601-0001', 'Компьютер Dell Inspiron 3000', 'Настольный компьютер для администрации', 'Fixed Assets', 450000, 1, 'Active', 1, 'DL2024-001', '2024-06-01', 'Dell Узбекистан', 'Основной компьютер администратора'),
('INV-20250601-0002', 'Ноутбук HP Pavilion 15', 'Ноутбук для преподавателей', 'Fixed Assets', 380000, 3, 'Active', 1, 'HP2024-002', '2024-06-01', 'HP Store Tashkent', 'Для мобильных занятий'),
('INV-20250601-0003', 'Принтер Canon PIXMA G3470', 'Многофункциональный принтер', 'Fixed Assets', 120000, 2, 'Active', 1, 'CN2024-003', '2024-06-01', 'Canon Центр', 'Печать материалов'),
('INV-20250602-0004', 'Проектор Epson EB-S41', 'Проектор для презентаций', 'Fixed Assets', 280000, 5, 'Active', 1, 'EP2024-004', '2024-06-02', 'Epson Uzbekistan', 'Для учебных аудиторий'),
('INV-20250602-0005', 'Интерактивная доска Smart Board', 'Интерактивная доска 85 дюймов', 'Fixed Assets', 850000, 2, 'Active', 1, 'SB2024-005', '2024-06-02', 'Smart Technologies', 'Современные аудитории'),

-- Office furniture
('INV-20250603-0006', 'Стол офисный Ikea Bekant', 'Рабочий стол 160x80 см', 'Fixed Assets', 45000, 10, 'Active', 1, 'IK2024-006', '2024-06-03', 'Ikea Tashkent', 'Для рабочих мест'),
('INV-20250603-0007', 'Кресло офисное Markus', 'Эргономичное кресло', 'Fixed Assets', 85000, 8, 'Active', 1, 'IK2024-007', '2024-06-03', 'Ikea Tashkent', 'Удобные кресла'),
('INV-20250603-0008', 'Шкаф для документов', 'Металлический шкаф с замком', 'Fixed Assets', 65000, 5, 'Active', 1, 'MT2024-008', '2024-06-03', 'Металл-Сервис', 'Хранение документов'),
('INV-20250603-0009', 'Стол для переговоров', 'Большой стол на 12 человек', 'Fixed Assets', 180000, 1, 'Active', 1, 'WD2024-009', '2024-06-03', 'Wood Design', 'Переговорная комната'),

-- Audio/Video equipment for Samarkand
('INV-20250604-0010', 'Звуковая система JBL', 'Профессиональная аудиосистема', 'Fixed Assets', 320000, 1, 'Active', 3, 'JBL2024-010', '2024-06-04', 'Audio Pro Samarkand', 'Для больших аудиторий'),
('INV-20250604-0011', 'Микрофонная система Shure', 'Беспроводные микрофоны', 'Fixed Assets', 150000, 4, 'Active', 3, 'SH2024-011', '2024-06-04', 'Sound Equipment', 'Качественный звук'),

-- Equipment for Bukhara
('INV-20250605-0012', 'Кондиционер Samsung', 'Настенный кондиционер 24000 BTU', 'Fixed Assets', 220000, 3, 'Active', 5, 'SM2024-012', '2024-06-05', 'Climate Control', 'Комфортный климат'),
('INV-20250605-0013', 'Система видеонаблюдения Hikvision', 'IP камеры и видеорегистратор', 'Fixed Assets', 180000, 1, 'Active', 5, 'HK2024-013', '2024-06-05', 'Security Systems', 'Безопасность здания');

-- ==========================================
-- ASSETS DATA - MATERIALS
-- ==========================================

-- Office supplies
INSERT INTO assets (inventory_number, name, description, category, cost, quantity, status, warehouse_id, purchase_date, supplier, notes) VALUES 
('INV-20250606-0014', 'Бумага А4 Navigator', 'Офисная бумага 80г/м², 500 листов', 'Materials', 2500, 50, 'Active', 2, '2024-06-06', 'Office Supply', 'Основная бумага для печати'),
('INV-20250606-0015', 'Ручки шариковые Pilot', 'Синие ручки, упаковка 50 шт', 'Materials', 1200, 20, 'Active', 2, '2024-06-06', 'Pilot Uzbekistan', 'Для студентов и преподавателей'),
('INV-20250606-0016', 'Маркеры для доски Stabilo', 'Цветные маркеры, набор 12 шт', 'Materials', 3500, 15, 'Active', 2, '2024-06-06', 'Stabilo Central Asia', 'Для интерактивных досок'),
('INV-20250606-0017', 'Папки для документов', 'Пластиковые папки А4', 'Materials', 800, 100, 'Active', 2, '2024-06-06', 'Office World', 'Организация документов'),
('INV-20250606-0018', 'Скобы для степлера', 'Скобы №10, упаковка 1000 шт', 'Materials', 300, 30, 'Active', 2, '2024-06-06', 'Office Supply', 'Расходный материал'),

-- IT supplies
('INV-20250607-0019', 'Картриджи для принтера Canon', 'Оригинальные картриджи PG-46/CL-56', 'Materials', 8500, 20, 'Active', 2, '2024-06-07', 'Canon Service', 'Для принтеров Canon'),
('INV-20250607-0020', 'USB флешки Kingston 32GB', 'USB 3.0 накопители', 'Materials', 4200, 25, 'Active', 2, '2024-06-07', 'IT Solutions', 'Для передачи файлов'),
('INV-20250607-0021', 'Кабели HDMI', 'Кабели HDMI 1.5м', 'Materials', 1500, 15, 'Active', 2, '2024-06-07', 'Cable Pro', 'Подключение проекторов'),
('INV-20250607-0022', 'Батарейки AA Duracell', 'Алкалиновые батарейки, упаковка 8 шт', 'Materials', 2800, 10, 'Active', 2, '2024-06-07', 'Energy Store', 'Для микрофонов и пультов');

-- ==========================================
-- ASSETS DATA - GOODS
-- ==========================================

-- Educational materials
INSERT INTO assets (inventory_number, name, description, category, cost, quantity, status, warehouse_id, purchase_date, supplier, notes) VALUES 
('INV-20250608-0023', 'Учебники английского языка Cambridge', 'English File Elementary, комплект', 'Goods', 15000, 100, 'Active', 4, '2024-06-08', 'Cambridge University Press', 'Основные учебники'),
('INV-20250608-0024', 'Рабочие тетради Oxford', 'Дополнительные материалы', 'Goods', 8000, 150, 'Active', 4, '2024-06-08', 'Oxford Educational', 'Практические задания'),
('INV-20250608-0025', 'Аудио CD для занятий', 'Диски с упражнениями на аудирование', 'Goods', 2500, 50, 'Active', 4, '2024-06-08', 'Language Media', 'Развитие навыков слушания'),
('INV-20250608-0026', 'Словари англо-русские', 'Большой англо-русский словарь', 'Goods', 12000, 30, 'Active', 4, '2024-06-08', 'Dictionary House', 'Справочные материалы'),

-- Marketing materials
('INV-20250609-0027', 'Рекламные буклеты', 'Информация о курсах английского', 'Goods', 500, 500, 'Active', 6, '2024-06-09', 'Print Master', 'Маркетинговые материалы'),
('INV-20250609-0028', 'Визитки сотрудников', 'Корпоративные визитки', 'Goods', 300, 1000, 'Active', 6, '2024-06-09', 'Business Print', 'Представительские материалы'),
('INV-20250609-0029', 'Фирменные ручки с логотипом', 'Промо-ручки Result Education', 'Goods', 1200, 200, 'Active', 6, '2024-06-09', 'Promo Gifts', 'Сувенирная продукция');

-- ==========================================
-- ASSETS DATA - INVENTORY
-- ==========================================

-- Cleaning supplies
INSERT INTO assets (inventory_number, name, description, category, cost, quantity, status, warehouse_id, purchase_date, supplier, notes) VALUES 
('INV-20250610-0030', 'Моющие средства Fairy', 'Средство для мытья посуды', 'Inventory', 1800, 12, 'Active', 2, '2024-06-10', 'Household Store', 'Кухня офиса'),
('INV-20250610-0031', 'Туалетная бумага Zewa', 'Качественная туалетная бумага', 'Inventory', 2200, 24, 'Active', 2, '2024-06-10', 'Hygiene Plus', 'Санузлы офиса'),
('INV-20250610-0032', 'Мешки для мусора', 'Прочные пакеты 120л', 'Inventory', 1500, 20, 'Active', 2, '2024-06-10', 'Clean World', 'Уборка помещений'),

-- Kitchen supplies
('INV-20250610-0033', 'Кофе для офиса Jacobs', 'Растворимый кофе банка 190г', 'Inventory', 3500, 8, 'Active', 2, '2024-06-10', 'Coffee Time', 'Кофе-брейки'),
('INV-20250610-0034', 'Чай Ahmad Tea', 'Черный чай в пакетиках', 'Inventory', 2800, 10, 'Active', 2, '2024-06-10', 'Tea House', 'Чаепития в офисе'),
('INV-20250610-0035', 'Сахар-рафинад', 'Белый сахар кусковой 1кг', 'Inventory', 1200, 5, 'Active', 2, '2024-06-10', 'Sweet Store', 'К чаю и кофе'),
('INV-20250610-0036', 'Одноразовые стаканы', 'Бумажные стаканы 250мл, упаковка 100шт', 'Inventory', 800, 15, 'Active', 2, '2024-06-10', 'Disposable World', 'Для напитков');

-- ==========================================
-- SAMPLE OPERATIONS DATA
-- ==========================================

-- Receipt operations (поступления)
INSERT INTO asset_operations (type, asset_id, quantity, to_warehouse_id, user_id, operation_date, reason, document_number, notes) VALUES 
(1, 'Receipt', 1, 1, NULL, 1, '2024-06-01 09:00:00', 'Закупка нового оборудования', 'ПО-2024-001', 'Поступление компьютера Dell'),
(2, 'Receipt', 3, 1, NULL, 1, '2024-06-01 09:30:00', 'Закупка ноутбуков для преподавателей', 'ПО-2024-002', 'Партия ноутбуков HP'),
(3, 'Receipt', 2, 1, NULL, 1, '2024-06-01 10:00:00', 'Покупка принтеров', 'ПО-2024-003', 'Многофункциональные принтеры'),
(4, 'Receipt', 50, 2, NULL, 1, '2024-06-06 14:00:00', 'Поставка канцтоваров', 'ПО-2024-004', 'Офисная бумага Navigator'),
(5, 'Receipt', 100, 4, NULL, 1, '2024-06-08 11:00:00', 'Поступление учебников', 'ПО-2024-005', 'Учебники Cambridge');

-- Transfer operations (перемещения)
INSERT INTO asset_operations (type, asset_id, quantity, from_warehouse_id, to_warehouse_id, user_id, operation_date, reason, document_number, notes) VALUES 
(6, 'Transfer', 6, 1, 1, 3, 3, '2024-06-15 10:00:00', 'Перемещение столов в Самарканд', 'ПМ-2024-001', 'Обустройство филиала'),
(7, 'Transfer', 4, 1, 1, 5, 3, '2024-06-16 11:00:00', 'Перемещение кресел в Бухару', 'ПМ-2024-002', 'Обустройство нового офиса'),
(8, 'Transfer', 1, 1, 1, 3, 3, '2024-06-17 09:30:00', 'Передача проектора в Самарканд', 'ПМ-2024-003', 'Для презентаций'),
(9, 'Transfer', 20, 4, 2, 6, 2, '2024-06-18 14:00:00', 'Перемещение учебников', 'ПМ-2024-004', 'Пополнение склада материалов');

-- Adjustment operations (корректировки)
INSERT INTO asset_operations (type, asset_id, quantity, user_id, operation_date, reason, cost_before, cost_after, notes) VALUES 
(10, 'Adjustment', 14, 1, 2, '2024-06-20 16:00:00', 'Переоценка стоимости', 2500.00, 2800.00, 'Корректировка цены бумаги'),
(11, 'Adjustment', 30, 1, 2, '2024-06-21 10:00:00', 'Списание части товара', NULL, NULL, 'Корректировка количества столов');

-- Disposal operations (списания)
INSERT INTO asset_operations (type, asset_id, quantity, from_warehouse_id, user_id, operation_date, reason, document_number, notes) VALUES 
(12, 'Disposal', 32, 1, 2, 1, '2024-06-25 15:00:00', 'Поломка вследствие износа', 'СП-2024-001', 'Старые мешки для мусора');

-- Update asset statuses based on operations
UPDATE assets SET status = 'Disposed' WHERE id = 32;
UPDATE assets SET warehouse_id = 3 WHERE id = 6; -- Столы перемещены в Самарканд
UPDATE assets SET warehouse_id = 5 WHERE id = 7; -- Кресла перемещены в Бухару
UPDATE assets SET warehouse_id = 3 WHERE id = 4; -- Проектор перемещен в Самарканд
UPDATE assets SET cost = 2800 WHERE id = 14; -- Корректировка цены бумаги
UPDATE assets SET quantity = 8 WHERE id = 6; -- Корректировка количества столов (перемещено 2)

-- ==========================================
-- AUDIT LOG SAMPLES
-- ==========================================

INSERT INTO audit_logs (user_id, company_id, action, resource_type, resource_id, timestamp, ip_address) VALUES 
(1, 1, 'CREATE', 'Asset', 1, '2024-06-01 09:00:00', '192.168.1.100'),
(1, 1, 'CREATE', 'Asset', 2, '2024-06-01 09:30:00', '192.168.1.100'),
(3, 1, 'TRANSFER', 'Asset', 6, '2024-06-15 10:00:00', '192.168.1.105'),
(2, 1, 'ADJUSTMENT', 'Asset', 14, '2024-06-20 16:00:00', '192.168.1.102'),
(1, 1, 'LOGIN', 'User', 1, CURRENT_TIMESTAMP, '192.168.1.100');

-- ==========================================
-- UPDATE STATISTICS
-- ==========================================

-- Update table statistics for better query performance
ANALYZE companies;
ANALYZE users;
ANALYZE branches;
ANALYZE warehouses;
ANALYZE assets;
ANALYZE asset_operations;
ANALYZE audit_logs;

-- Create some test data for different time periods for analytics
-- Additional operations for the last 6 months
INSERT INTO asset_operations (type, asset_id, quantity, to_warehouse_id, user_id, operation_date, reason) VALUES 
('Receipt', 1, 1, 1, 1, '2024-01-15 10:00:00', 'Quarterly procurement'),
('Receipt', 2, 2, 1, 1, '2024-02-20 11:00:00', 'Equipment upgrade'),
('Transfer', 3, 1, 1, 3, '2024-03-10 14:00:00', 'Office reorganization'),
('Receipt', 14, 25, 2, 1, '2024-04-05 09:00:00', 'Supplies restocking'),
('Disposal', 31, 10, 2, 2, '2024-05-12 16:00:00', 'Expired items');

COMMIT;

-- Success message
SELECT 'Seed data inserted successfully for Result Education!' as message;