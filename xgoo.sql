-- --------------------------------------------------------
-- Host:                         aws-1-ap-northeast-1.pooler.supabase.com
-- Server version:               PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit
-- Server OS:                    
-- HeidiSQL Version:             12.20.0.7320
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES  */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table public.booking_events
CREATE TABLE IF NOT EXISTS "booking_events" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"job_id" VARCHAR NOT NULL,
	"shipment_id" VARCHAR NOT NULL,
	"level" VARCHAR(10) NOT NULL DEFAULT 'info',
	"step" VARCHAR(80) NOT NULL,
	"message" TEXT NOT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	CONSTRAINT "booking_events_job_id_booking_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "booking_jobs" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT "booking_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_booking_events_job" ON "" ("job_id");
CREATE INDEX "idx_booking_events_shipment" ON "" ("shipment_id");;

-- Dumping data for table public.booking_events: 52 rows
INSERT INTO "booking_events" ("id", "job_id", "shipment_id", "level", "step", "message", "created_at") VALUES
	('025f3c9f-3dea-4be9-86a3-e38ad2665df6', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:50:37.490616'),
	('0e489982-ba85-4965-8c24-d2224b8dde54', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:49:37.463832'),
	('0e7b4aaf-fc22-482e-87f3-9acf2346c47d', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:49:37.593383'),
	('125ec60c-78f0-4611-8dc9-5e22f6676b05', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:44:53.489869'),
	('13218174-cbaf-494a-9782-b79f423b0d33', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:55:22.323045'),
	('165b0039-8ea2-45a2-95d8-37b4aae2f18a', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:49:37.200256'),
	('1975b10e-e4d5-402a-a95d-a63271112830', '7f6a2e1a-50ca-4ecd-9dd5-f52b77c002cc', 'e9ed8712-3d56-4da5-8922-115468b019b8', 'info', 'browser_assist', 'Operator must complete booking on https://www.bluedart.com/. Unattended website automation is not implemented.', '2026-08-20 05:29:48.038932'),
	('1aeb56b1-36f3-40de-8dac-3e81ba761d93', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:15:27.789931'),
	('2272bd24-87fe-4bb9-9417-06fe5e8deeb9', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'error', 'failed', 'Delhivery did not create the shipment: shipment list contains no data.', '2026-08-19 09:37:33.249727'),
	('26474dfb-2f7c-46ca-af30-9341ffde698b', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:35:06.504295'),
	('2b7ec7b1-ebfe-41a6-a244-30f05bb9122d', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'error', 'failed', 'Delhivery rejected the order: warehouse "COURIER POINT" or client "M/S MURTHY ENTERPRISES" does not match Delhivery One. Copy the name from Pickup Locations (case-sensitive) into DELHIVERY_PICKUP_LOCATION, and the registered company name into DELHIVERY_CLIENT_NAME — not the admin person. Then restart npm run dev.', '2026-08-19 09:45:42.176293'),
	('2f369585-f3db-47b3-8e06-74ecfce5ac0a', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'serviceability', 'Checking Delhivery serviceability for 160055', '2026-08-19 09:45:41.472636'),
	('2fb5e040-da6d-413f-bc4c-8271ebfd79ce', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'serviceability', 'Checking Delhivery serviceability for 160055', '2026-08-19 09:37:32.512352'),
	('33d10660-b050-4602-93ff-95fde8ece09d', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:05:38.389455'),
	('34202f6f-6a71-4da9-9883-e56b01382c90', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'connecting', 'Creating Delhivery order at COURIER POINT', '2026-08-19 09:45:41.744594'),
	('35298eb6-fd86-4d38-ad01-ab969ce88d20', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:44:53.991376'),
	('3cbc6464-30d7-4054-a705-50f2c1ca1887', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:05:38.764841'),
	('4066f070-179b-4f37-9c8f-759d1f221b1d', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:52:52.616659'),
	('418d3395-af0b-430d-9646-3490c50ddaf6', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'start', 'Booking started via delhivery_api', '2026-08-19 09:54:23.854562'),
	('44e442d2-af82-4c98-b9b2-2c131b726a65', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'start', 'Retry 3 of 3 via delhivery_api', '2026-08-19 09:45:41.232945'),
	('463d8d1f-5e91-44a7-b905-08b089671ee4', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:55:22.707123'),
	('48ea7783-3673-44f9-9be4-129d318ede55', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:44:54.356218'),
	('492a3ea5-d724-4a5d-9edb-ff0f360db303', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'serviceability', 'Checking Delhivery serviceability for 160055', '2026-08-19 09:44:24.49211'),
	('4a561ce3-6a98-4b69-b296-ddc404e8733b', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:28:39.395383'),
	('54b57ccd-25b8-4ca1-a6bb-8c04b41cddc7', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'created', 'Booking job created for World First Courier (browser_automation).', '2026-08-18 20:05:38.131344'),
	('5528a55c-2edf-47f3-ac69-805455b7933d', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:52:52.489703'),
	('58f68dec-3e89-48c0-9686-f21ca589bf24', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:15:28.30807'),
	('5af799f7-ec20-470c-961c-ea91a3c30aa6', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:28:39.140469'),
	('5bbf2353-489c-4bb9-baee-a02e1069da77', '7f6a2e1a-50ca-4ecd-9dd5-f52b77c002cc', 'e9ed8712-3d56-4da5-8922-115468b019b8', 'warn', 'action_required', 'Open Blue Dart and finish booking in the partner portal. Capture the AWB when done.', '2026-08-20 05:29:48.428596'),
	('60f3adfe-80c0-4c30-a472-c7f77da784bf', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:52:53.000934'),
	('64d83c9e-aedc-48f1-8797-d53fbefe86b3', '0d6a3ac2-a6ab-4824-940f-a786024ff3d6', '824ded62-f98b-4fef-864b-516a32d4f080', 'error', 'failed', 'Delhivery returned invalid JSON (401): Login or API Key Required', '2026-08-19 08:55:15.131667'),
	('658f0fdb-9ae6-4617-b285-f06bcb8d1276', '7f6a2e1a-50ca-4ecd-9dd5-f52b77c002cc', 'e9ed8712-3d56-4da5-8922-115468b019b8', 'info', 'created', 'Booking job created for Blue Dart (browser_automation).', '2026-08-20 05:29:47.515811'),
	('66149a82-bf70-436b-9a31-46b0238c550b', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:05:38.639159'),
	('6671d147-358b-49cf-946f-82f8bcf27d0c', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:44:53.747279'),
	('68bb92c4-858a-44a7-bbd2-98663f19bcff', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'cancelled', 'Cancelled Delhivery AWB 38566010008120', '2026-08-19 10:38:03.291805'),
	('68e122bd-b796-49c5-ba84-4162a96a1b1a', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'connecting', 'Creating Delhivery order at courier point', '2026-08-19 09:37:32.798333'),
	('6cda3605-9da5-4641-9510-41ff1cd04afe', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:44:53.869941'),
	('7078a7e7-833f-4377-aa8f-e2035e887a97', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'resume', 'Operator continuing after OTP. Login completed on World First — XGoo does not store OTPs.', '2026-08-18 20:20:15.92165'),
	('789133ad-d6d7-49ec-865d-d071591b2c12', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:06:14.9647'),
	('808b175d-fa29-4255-8a90-68cb4a3440d6', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:49:38.113849'),
	('8afd09b2-e5ae-435f-90a4-927af8e8dedf', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'warn', 'pickup', 'Delhivery pickup request failed (400): unknown error AWB 38566010008120 is still booked.', '2026-08-19 09:54:25.260351'),
	('8be46ce4-de48-4cab-a633-c50c0063ea36', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'start', 'Booking started via delhivery_api', '2026-08-19 09:37:32.267384'),
	('8c81a8a7-35e1-4f08-a4eb-41ca45b442dd', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:50:36.96998'),
	('8d6fafba-64a1-4b29-aceb-e7897148badb', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'start', 'Retry 2 of 3 via delhivery_api', '2026-08-19 09:44:24.240147'),
	('903beeec-7011-4f50-a6d6-423a3fa65a30', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:50:37.881079'),
	('90df3f0f-110a-4e00-b896-5fd9422d5e0a', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:49:37.722454'),
	('913b09fd-7ab1-4b82-970f-c904355087c9', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:28:40.004953'),
	('934f4acf-565c-4e80-b4e2-53be1c822bd2', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:28:39.638595'),
	('944a5917-a20c-4e35-8fba-9e3171ef65ef', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:15:28.049839'),
	('95955893-9dd4-4816-91d1-769b7c323bc2', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'error', 'failed', 'Delhivery rejected the order: warehouse "COURIER POINT" or client "M/S MURTHY ENTERPRISES" does not match Delhivery One. Copy the name from Pickup Locations (case-sensitive) into DELHIVERY_PICKUP_LOCATION, and the registered company name into DELHIVERY_CLIENT_NAME — not the admin person. Then restart npm run dev.', '2026-08-19 09:44:25.178368'),
	('9f2f6f3c-a202-4a05-8429-facb28dbe18c', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:35:06.228167'),
	('a066b1ce-cfb0-4c42-a5c2-7f1ef4dd204f', '0d6a3ac2-a6ab-4824-940f-a786024ff3d6', '824ded62-f98b-4fef-864b-516a32d4f080', 'info', 'created', 'Booking job created for Delhivery (api).', '2026-08-19 08:55:13.759705'),
	('a84f2374-0255-4c89-9ca6-9b73a860a936', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:50:37.360778'),
	('b0db0f28-ea2c-4bae-be3e-bc0af9bd6bf5', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:52:52.362454'),
	('b38d0d85-d5b2-4a98-ab29-530c6e7e6dff', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:55:21.811372'),
	('bb77e6d9-53c4-4131-9304-7dbe6054d9ab', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:06:14.342813'),
	('bc705fb4-9b40-4885-97f9-31cc20b292ed', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'serviceability', 'Checking Delhivery serviceability for 160055', '2026-08-19 09:54:24.105431'),
	('bf769fb0-a017-4fe2-8c63-ba2f8101cb43', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:35:07.155693'),
	('bf7f728c-3ec5-494d-a5e5-53979e09b686', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:28:39.517558'),
	('c4169f4f-b5cf-4367-ade7-7b4a55bf7a3a', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:15:28.17794'),
	('c42d93bc-2ee3-40d4-ab23-8398e6df167d', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:35:06.765548'),
	('c502c6da-5779-4ca2-a8b5-cbaf0bed604a', '7f6a2e1a-50ca-4ecd-9dd5-f52b77c002cc', 'e9ed8712-3d56-4da5-8922-115468b019b8', 'info', 'start', 'Booking started via browser_assist', '2026-08-20 05:29:47.780632'),
	('c8a2e81a-27ac-43b5-8cc6-50e64e388e32', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'created', 'Booking job created for Delhivery (api).', '2026-08-19 09:37:32.007825'),
	('c8d357c6-cf3b-45ca-8b1c-4945ac61c127', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:06:14.590421'),
	('c95cae38-60f9-41d0-817e-a57b2f25753f', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:06:14.465842'),
	('cb1efa45-7ee3-4253-9367-d6574b7fa349', '0d6a3ac2-a6ab-4824-940f-a786024ff3d6', '824ded62-f98b-4fef-864b-516a32d4f080', 'info', 'serviceability', 'Checking Delhivery serviceability for 302001', '2026-08-19 08:55:14.270877'),
	('cc2d731f-f9e9-4d37-9b20-d2a2c023cd95', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:55:22.068261'),
	('cccdf637-3f5a-4efa-88d0-9a8d185da135', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:15:28.693095'),
	('d091bcf2-4e78-44f4-9a1a-4eb64d93dda0', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'open_portal', 'Open World First Xpresion at https://xpresion.worldfirst.in/', '2026-08-18 20:50:37.230571'),
	('d26a0c76-5bc8-4f3d-a47a-ebfbc36675c2', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'complete', 'Booked with AWB 38566010008120', '2026-08-19 09:54:25.633347'),
	('d79b7130-91bc-4b7d-b1b0-5ec9f60cd6c0', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:55:22.196147'),
	('d84769f7-9cde-4372-bbeb-67370cfbc89d', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'action_required', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', '2026-08-18 20:05:39.266723'),
	('dac7d04f-3ac6-47f2-9051-9318969f205d', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'booked', 'Delhivery assigned waybill 38566010008120', '2026-08-19 09:54:24.847061'),
	('e34bc57e-fcda-49ae-ba0a-d8a4a4fe411d', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'connecting', 'Creating Delhivery order at COURIER POINT', '2026-08-19 09:44:24.745246'),
	('ee9e3bcf-25f2-4065-aaf8-dffb70964326', '7a39288e-9caf-40bc-bcea-1251a8c23c10', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'info', 'connecting', 'Creating Delhivery order at courier point', '2026-08-19 09:54:24.369484'),
	('f18d0241-329d-458a-b704-777356dee0fa', '0d6a3ac2-a6ab-4824-940f-a786024ff3d6', '824ded62-f98b-4fef-864b-516a32d4f080', 'info', 'start', 'Booking started via delhivery_api', '2026-08-19 08:55:14.021266'),
	('f1b9ba75-1a85-4640-bb49-be1465987b0f', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:06:14.09201'),
	('f2370e30-434d-4c56-a80f-f581bdf5cf2d', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'warn', 'authenticate', 'World First login requires OTP via SMS, WhatsApp, or email (valid 10 minutes). Enter it on their site. XGoo does not store or bypass OTPs.', '2026-08-18 20:35:06.634708'),
	('f2a6da82-2969-45d5-9061-603963badb83', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'start', 'Booking started via world_first_browser', '2026-08-18 20:52:52.094971'),
	('f30d8055-fff3-49c0-b386-0c73d8c93b2f', '4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'info', 'payload_ready', 'Autofill ready after OTP — sender XGoo Test Sender; consignee World First Test Consignee; 2.50 kg, 1 piece(s).', '2026-08-18 20:05:38.890158');

-- Dumping structure for table public.booking_jobs
CREATE TABLE IF NOT EXISTS "booking_jobs" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"shipment_id" VARCHAR NOT NULL,
	"courier_partner_id" VARCHAR NULL DEFAULT NULL,
	"status" VARCHAR(30) NOT NULL DEFAULT 'draft',
	"booking_method" VARCHAR(30) NOT NULL,
	"attempt_count" INTEGER NOT NULL DEFAULT 0,
	"max_attempts" INTEGER NOT NULL DEFAULT 3,
	"error" TEXT NULL DEFAULT NULL,
	"action_required_reason" TEXT NULL DEFAULT NULL,
	"next_action" VARCHAR(40) NULL DEFAULT NULL,
	"awb_number" VARCHAR(100) NULL DEFAULT NULL,
	"booking_reference" VARCHAR(100) NULL DEFAULT NULL,
	"label_url" VARCHAR(500) NULL DEFAULT NULL,
	"operator_user_id" VARCHAR NULL DEFAULT NULL,
	"started_at" TIMESTAMP NULL DEFAULT NULL,
	"completed_at" TIMESTAMP NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	CONSTRAINT "booking_jobs_courier_partner_id_courier_partners_id_fk" FOREIGN KEY ("courier_partner_id") REFERENCES "courier_partners" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
	CONSTRAINT "booking_jobs_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT "booking_jobs_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_booking_jobs_shipment" ON "" ("shipment_id");
CREATE INDEX "idx_booking_jobs_office" ON "" ("office_id");
CREATE INDEX "idx_booking_jobs_status" ON "" ("status");;

-- Dumping data for table public.booking_jobs: -1 rows
INSERT INTO "booking_jobs" ("id", "office_id", "shipment_id", "courier_partner_id", "status", "booking_method", "attempt_count", "max_attempts", "error", "action_required_reason", "next_action", "awb_number", "booking_reference", "label_url", "operator_user_id", "started_at", "completed_at", "created_at", "updated_at") VALUES
	('0d6a3ac2-a6ab-4824-940f-a786024ff3d6', '35329240-859e-4d67-a256-53eb2b96cd58', '824ded62-f98b-4fef-864b-516a32d4f080', '5026ddb3-bc3f-4817-9c02-33a141bb56e9', 'booking_failed', 'api', 1, 3, 'Delhivery returned invalid JSON (401): Login or API Key Required', NULL, NULL, NULL, NULL, NULL, '203ef505-318f-4d11-a2b6-931a5f022980', '2026-08-19 08:55:13.244', '2026-08-19 08:55:14.238', '2026-08-19 08:55:13.606185', '2026-08-19 08:55:14.238'),
	('4c17c59f-3440-48b0-aa89-f9e88e4d24fe', '35329240-859e-4d67-a256-53eb2b96cd58', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'action_required', 'browser_automation', 10, 3, NULL, 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', 'otp', NULL, NULL, NULL, '203ef505-318f-4d11-a2b6-931a5f022980', '2026-08-18 20:55:21.146', NULL, '2026-08-18 20:05:37.970645', '2026-08-18 20:55:21.913'),
	('7a39288e-9caf-40bc-bcea-1251a8c23c10', '35329240-859e-4d67-a256-53eb2b96cd58', '1d9a915d-e3f3-42bb-b023-010fc31065f3', '5026ddb3-bc3f-4817-9c02-33a141bb56e9', 'cancelled', 'api', 4, 3, NULL, NULL, 'none', '38566010008120', '38566010008120', NULL, '203ef505-318f-4d11-a2b6-931a5f022980', '2026-08-19 09:54:23.033', '2026-08-19 10:38:02.454', '2026-08-19 09:37:31.845265', '2026-08-19 10:38:02.455'),
	('7f6a2e1a-50ca-4ecd-9dd5-f52b77c002cc', '35329240-859e-4d67-a256-53eb2b96cd58', 'e9ed8712-3d56-4da5-8922-115468b019b8', '985a1a59-666d-42bd-9814-a629b455ad18', 'action_required', 'browser_automation', 1, 3, NULL, 'Open Blue Dart and finish booking in the partner portal. Capture the AWB when done.', 'browser', NULL, NULL, NULL, '203ef505-318f-4d11-a2b6-931a5f022980', '2026-08-20 05:29:48.718', NULL, '2026-08-20 05:29:47.380012', '2026-08-20 05:29:49.237');

-- Dumping structure for table public.booking_requests
CREATE TABLE IF NOT EXISTS "booking_requests" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"request_number" VARCHAR(50) NOT NULL,
	"sender_name" VARCHAR(255) NOT NULL,
	"sender_phone" VARCHAR(20) NOT NULL,
	"sender_email" VARCHAR(255) NULL DEFAULT NULL,
	"sender_address" TEXT NOT NULL,
	"sender_city" VARCHAR(100) NULL DEFAULT NULL,
	"sender_state" VARCHAR(100) NULL DEFAULT NULL,
	"sender_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"receiver_name" VARCHAR(255) NOT NULL,
	"receiver_phone" VARCHAR(20) NOT NULL,
	"receiver_address" TEXT NOT NULL,
	"receiver_city" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_state" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"weight" NUMERIC(10,2) NULL DEFAULT NULL,
	"number_of_pieces" INTEGER NULL DEFAULT 1,
	"content_description" TEXT NULL DEFAULT NULL,
	"declared_value" NUMERIC(12,2) NULL DEFAULT NULL,
	"package_photo_urls" UNKNOWN NULL DEFAULT NULL,
	"service_type" VARCHAR(20) NULL DEFAULT 'surface',
	"courier_preference" VARCHAR(255) NULL DEFAULT NULL,
	"pickup_lat" NUMERIC(10,7) NULL DEFAULT NULL,
	"pickup_lng" NUMERIC(10,7) NULL DEFAULT NULL,
	"pickup_location_name" VARCHAR(500) NULL DEFAULT NULL,
	"customer_user_id" VARCHAR NULL DEFAULT NULL,
	"status" VARCHAR(20) NOT NULL DEFAULT 'pending',
	"notes" TEXT NULL DEFAULT NULL,
	"converted_shipment_id" VARCHAR NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"reviewed_at" TIMESTAMP NULL DEFAULT NULL,
	"pickup_date" VARCHAR(10) NULL DEFAULT NULL,
	"pickup_time_slot" VARCHAR(40) NULL DEFAULT NULL,
	"branch_id" VARCHAR NULL DEFAULT NULL,
	"is_demo" BOOLEAN NULL DEFAULT false,
	"source" VARCHAR(30) NOT NULL DEFAULT 'legacy',
	"shipment_type" VARCHAR(30) NOT NULL DEFAULT 'domestic',
	"destination_country" VARCHAR(100) NULL DEFAULT NULL,
	"package_length" NUMERIC(10,2) NULL DEFAULT NULL,
	"package_width" NUMERIC(10,2) NULL DEFAULT NULL,
	"package_height" NUMERIC(10,2) NULL DEFAULT NULL,
	"package_items" UNKNOWN NULL DEFAULT NULL,
	"sender_address_line2" TEXT NULL DEFAULT NULL,
	"receiver_address_line2" TEXT NULL DEFAULT NULL,
	"xgoo_order_id" VARCHAR(32) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "booking_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "booking_requests_converted_shipment_id_shipments_id_fk" FOREIGN KEY ("converted_shipment_id") REFERENCES "shipments" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "booking_requests_customer_user_id_customer_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "booking_requests_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_booking_requests_office" ON "" ("office_id");
CREATE INDEX "idx_booking_requests_status" ON "" ("status");
CREATE INDEX "idx_booking_requests_number" ON "" ("request_number");
CREATE INDEX "idx_booking_requests_customer_user" ON "" ("customer_user_id");
CREATE INDEX "idx_booking_requests_xgoo_order_id" ON "" ("xgoo_order_id");;

-- Dumping data for table public.booking_requests: 15 rows
INSERT INTO "booking_requests" ("id", "office_id", "request_number", "sender_name", "sender_phone", "sender_email", "sender_address", "sender_city", "sender_state", "sender_pincode", "receiver_name", "receiver_phone", "receiver_address", "receiver_city", "receiver_state", "receiver_pincode", "weight", "number_of_pieces", "content_description", "declared_value", "package_photo_urls", "service_type", "courier_preference", "pickup_lat", "pickup_lng", "pickup_location_name", "customer_user_id", "status", "notes", "converted_shipment_id", "created_at", "reviewed_at", "pickup_date", "pickup_time_slot", "branch_id", "is_demo", "source", "shipment_type", "destination_country", "package_length", "package_width", "package_height", "package_items", "sender_address_line2", "receiver_address_line2", "xgoo_order_id") VALUES
	('0e631a9b-0c9d-4acb-9e6e-ddd96bba2426', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMR6LYGNPIT', 'Walk-in Demo', '9876500005', NULL, 'Counter booking sample', 'Delhi', 'Delhi', '110001', 'Remote Demo', '9876500006', 'Jaipur hub', 'Jaipur', 'Rajasthan', '302001', 1.00, 1, NULL, NULL, NULL, 'surface', NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '2026-07-04 17:00:10.520891', NULL, NULL, NULL, NULL, 'true', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('1c55f358-33f7-4543-a1c4-1b14205227dc', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMRJL6H0I2M', 'Nihal', '7799846684', 'sanjeevnihal@live.com', 'Bowrampet', 'Dundigal mandal', 'Telangana', '500090', 'Krishna Murthy', '9966032234', 'Yelahanka', 'Bengaluru', 'Karnataka', '560064', 15.00, 1, 'CLOTHS', NULL, NULL, 'surface', NULL, 17.5466727, 78.3937283, 'Simhapuri Colony, Bowrampet, Dundigal mandal, Medchal–Malkajgiri, Telangana, 500090, India', '52fc42de-a976-4165-bad8-f02363d35cfb', 'pending', NULL, NULL, '2026-07-13 18:59:25.896983', NULL, '2026-07-13', '09:00-12:00', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('1cd3b50e-949a-4e60-9d28-ca5334186e7a', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMRS060C6NX', 'Sanjeev Nihal', '7799846684', 'sanjeevnihal.s@gmail.com', 'G9WR+69G, Hyderabad, Telangana, 500043', 'Hyderabad', 'Telangana', '500043', 'Karthik', '9876543210', 'Yelahanka, ishaq layout', 'Bangalore', 'Karnataka', '560064', 15.00, 1, 'Clothes', 5000.00, NULL, 'surface', NULL, 17.5455376, 78.3908532, 'G9WR+69G, Hyderabad, Telangana, 500043', '79a4f427-bb1c-4296-b3d5-57f49cfb6979', 'pending', NULL, NULL, '2026-07-19 16:21:06.711411', NULL, '2026-07-19', '09:00-12:00', NULL, 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('2a91a511-f066-4f69-8ebb-5cca6f6aeda8', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMRCFEF4D03', 'Nihal', '7799846684', 'sanjeevnihal@live.com', 'Satyam Valley, Villa No 2, Rajeev Gandhi Nagar, Bachupally, Hyderabad', 'Hyderabad', 'Telangana', '500090', 'SWETHA SINGARI', '9966032234', 'Satyam Valley, Villa No 2, Raj
Bachupally, Qutubullapur', 'K.V.Rangareddy', 'Telangana', '500090', 45.00, 1, 'CLOTHS', 4998.00, NULL, 'surface', 'Delhivery', 17.5458316, 78.3908584, 'Simhapuri Colony, Bowrampet, Dundigal mandal, Medchal–Malkajgiri, Telangana, 500090, India', '52fc42de-a976-4165-bad8-f02363d35cfb', 'converted', '', 'fd325b73-8b8a-4909-b6aa-c1969ed66864', '2026-07-08 18:43:15.793867', '2026-07-11 13:36:36.408', '2026-07-08', '09:00-12:00', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('2ad4e271-f7be-4c90-938f-5b68b117df25', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMLB2G7N597', 'Test Customer', '9876543210', NULL, '123 Main St', NULL, NULL, NULL, 'John Doe', '9876543211', '456 Oak Ave', 'Delhi', NULL, NULL, NULL, 1, NULL, NULL, NULL, 'surface', NULL, NULL, NULL, NULL, '0449e3af-e18a-4845-8d96-67959eb4bcaf', 'pending', NULL, NULL, '2026-02-06 15:54:42.738', NULL, NULL, NULL, NULL, 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('34c01faa-dec3-4fc3-9fde-7d85647cec1a', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMLB2N39GT2', 'Portal Test User M4LUPR', '9106134823', '', '123 Test Sender Address', 'Chennai', 'Tamil Nadu', '600001', 'Test Receiver', '8765432109', '789 Test Street, Test City', 'Chennai', '', '', 1.00, 1, '', 1000.00, NULL, 'surface', 'none', NULL, NULL, NULL, 'cdee6b47-8860-4861-9f14-ddbcd52a5554', 'pending', '', NULL, '2026-02-06 16:00:03.654', NULL, NULL, NULL, NULL, 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('4a7932eb-bf84-4a8a-ab68-ec7674630b55', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMSIW7QL3TV', 'Sanjeev Nihal', '7799846684', 'sanjeevnihal.s@gmail.com', 'G9WR+69G, Hyderabad, Telangana, 500043, India', 'Hyderabad', 'Telangana', '500043', 'Krishna', '9160711252', 'Yelahanka, Bangalore', 'Bangalore', 'Karnataka', '500090', 10.00, 1, 'Clothes', 5000.00, NULL, 'surface', NULL, 17.5455452, 78.3908502, 'G9WR+69G, Hyderabad, Telangana, 500043, India', '79a4f427-bb1c-4296-b3d5-57f49cfb6979', 'approved', 'Care', NULL, '2026-08-07 12:00:14.724806', '2026-08-18 19:52:41.298', '2026-08-07', '09:00-12:00', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', 'false', 'mobile_android', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('4c1feb8a-2b3b-41b8-a9dc-ec564b602244', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMRKD7WYKNL', 'Lakshya Verma', '9878801587', 'verma.lakshya071@gmail.com', 'Green homes coliving pearl, Gachibowli', 'Hyderabad', 'Telangana', '500032', 'Lakshya Verma', '9878801587', 'The Paul Hotel', 'Banglore', 'Karnataka', '560071', 20.00, 3, 'two medium suitcases, one folded table', NULL, NULL, 'surface', NULL, 17.4487856, 78.3638547, 'Gachibowli - Miyapur Highway, Studiorigin - Interior Designer in Hyderabad, Ward 106 Serilingampally, Hyderabad, Serilingampalle mandal, Ranga Reddy, Telangana, 500032, India', NULL, 'pending', NULL, NULL, '2026-07-14 08:04:21.093525', NULL, '2026-07-14', '09:00-12:00', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('778c471d-b000-4622-b1d8-6e15b91a7729', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMTWQH9Q0Q9', 'Kondapur Cloth House', '9887766554', 'clothhouse.b2b.verify@xgoo.test', 'Gachibowli Main Road, Kondapur', 'Hyderabad', NULL, NULL, 'Warehouse Hub', '9966032234', 'Jeedimetla Industrial Area', 'Hyderabad', NULL, NULL, 2.00, 1, 'Clothes', NULL, NULL, 'surface', NULL, NULL, NULL, 'Gachibowli Main Road, Kondapur', 'e0625663-f0e6-4554-bbfe-0e3324be7961', 'reviewed', NULL, NULL, '2026-09-11 09:08:11.071756', '2026-09-12 19:25:15.948', '2026-09-11', '09:00', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', 'false', 'b2b_daily', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('86740a7e-6821-4b8d-92ca-1f23803c3a1c', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMRJKKYZLF0', 'Nihal', '7799846684', 'sanjeevnihal@live.com', 'Satyam Valley, Villa No 2, Rajeev Gandhi Nagar, Bachupally, Hyderabad', 'Hyderabad', 'Telangana', '500090', 'Krishna Murthy', '9966032234', 'Yelahanka', 'Bengaluru', 'Karnataka', '560064', NULL, 1, NULL, NULL, NULL, 'surface', NULL, 17.5458316, 78.3908584, 'Satyam Valley, Villa No 2, Rajeev Gandhi Nagar, Bachupally, Hyderabad', '52fc42de-a976-4165-bad8-f02363d35cfb', 'pending', NULL, NULL, '2026-07-13 18:42:42.750252', NULL, '2026-07-13', '09:00-12:00', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('87aa85a8-077f-4f8b-8359-17b180bc3b7d', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMRJKZXYBF9', 'Nihal', '7799846684', 'sanjeevnihal@live.com', 'Bowrampet', 'Dundigal mandal', 'Telangana', '500090', 'Krishna Murthy', '9966032234', 'Yelahanka', 'Bengaluru', 'Karnataka', '560064', 10.00, 2, 'CLOTHS', NULL, NULL, 'surface', NULL, 17.5456669, 78.3906467, 'Simhapuri Colony, Bowrampet, Dundigal mandal, Medchal–Malkajgiri, Telangana, 500090, India', '52fc42de-a976-4165-bad8-f02363d35cfb', 'pending', NULL, NULL, '2026-07-13 18:54:21.251029', NULL, '2026-07-13', '09:00-12:00', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('993fc2d2-cb12-4a0b-a27f-ef23b5acc7ac', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMLBO2LFE5B', 'sanjeev nihal', '9160711252', 'sanjeevnihal.s@gmail.com', 'Satyam Valley, Villa No2, Rajeev Gandhi Nagar', 'Hyderabad', 'Telangana', '500090', 'Krishna Murthy ', '8951469173', '42-33, N.R peta, Kurnool 518004', 'Kurnool', 'Andhra Pradesh', '518004', 25.00, 2, 'Food and Electronics', 15000.00, NULL, 'surface', 'Delhivery', 15.0036332, 78.9880509, 'Mydukuru - Thaticherla Road, Porumamilla, Reddy Nagar, Porumamilla, YSR Kadapa, Andhra Pradesh, 516193, India', 'b66c47dd-e7ea-4183-bfb3-1e25e2bc6ff4', 'pending', 'None', NULL, '2026-02-07 01:59:58.972', NULL, NULL, NULL, NULL, 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('a020dd63-39b2-480e-9f4f-09f642dfc381', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMR6LYGJ5OQ', 'Demo Portal User', '9876500003', 'portal.demo@example.com', '12 Sample Street, Gachibowli', 'Hyderabad', 'Telangana', '500032', 'Demo Receiver', '9876500004', '88 MG Road', 'Bangalore', 'Karnataka', '560001', 3.50, 1, 'Books', 1500.00, NULL, 'surface', 'Delhivery', NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '2026-07-04 17:00:10.380354', NULL, NULL, NULL, NULL, 'true', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('a31ebbc7-d302-4b43-abab-a9f7d2ad4e8e', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMRJKX57X3P', 'Nihal', '7799846684', 'sanjeevnihal@live.com', 'Bowrampet', 'Dundigal mandal', 'Telangana', '500090', 'Krishna Murthy', '9966032234', 'Yelahanka', 'Bengaluru', 'Karnataka', '560064', 15.00, 2, 'CLOTHS', NULL, NULL, 'surface', NULL, 17.5466727, 78.3937283, 'Simhapuri Colony, Bowrampet, Dundigal mandal, Medchal–Malkajgiri, Telangana, 500090, India', '52fc42de-a976-4165-bad8-f02363d35cfb', 'pending', NULL, NULL, '2026-07-13 18:52:10.699248', NULL, '2026-07-13', '09:00-12:00', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('d1352839-7afc-4219-a1e2-3e3296ad3d95', '35329240-859e-4d67-a256-53eb2b96cd58', 'BRMRRYOQSQ4Z', 'Sanjeev Nihal', '7799846684', 'sanjeevnihal.s@gmail.com', 'Flat 202, west block, G9WR+69G, Hyderabad, Telangana, 500043', 'Hyderabad', 'Telangana', '500043', 'Krishna murthy ', '9876543210', 'N r peta, kurnool ', 'Kurnool', 'Andhra Pradesh ', '518004', 10.00, 1, 'Clothes', 5000.00, NULL, 'surface', NULL, 17.5455517, 78.3908598, 'G9WR+69G, Hyderabad, Telangana, 500043', '79a4f427-bb1c-4296-b3d5-57f49cfb6979', 'pending', 'Handle with care', NULL, '2026-07-19 15:39:41.555136', NULL, '2026-07-19', '09:00-12:00', NULL, 'false', 'legacy', 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Dumping structure for table public.branch_service_areas
CREATE TABLE IF NOT EXISTS "branch_service_areas" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"branch_id" VARCHAR NOT NULL,
	"pincode" VARCHAR(10) NOT NULL,
	"radius_km" NUMERIC(8,2) NULL DEFAULT '0',
	"center_lat" NUMERIC(10,7) NULL DEFAULT NULL,
	"center_lng" NUMERIC(10,7) NULL DEFAULT NULL,
	"label" VARCHAR(100) NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	CONSTRAINT "branch_service_areas_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_branch_service_areas_branch" ON "" ("branch_id");
CREATE INDEX "idx_branch_service_areas_pincode" ON "" ("pincode");;

-- Dumping data for table public.branch_service_areas: -1 rows

-- Dumping structure for table public.branches
CREATE TABLE IF NOT EXISTS "branches" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"address" TEXT NULL DEFAULT NULL,
	"city" VARCHAR(100) NULL DEFAULT NULL,
	"state" VARCHAR(100) NULL DEFAULT NULL,
	"pincode" VARCHAR(10) NULL DEFAULT NULL,
	"phone" VARCHAR(20) NULL DEFAULT NULL,
	"email" VARCHAR(255) NULL DEFAULT NULL,
	"is_primary" BOOLEAN NULL DEFAULT false,
	"is_active" BOOLEAN NULL DEFAULT true,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"lat" NUMERIC(10,7) NULL DEFAULT NULL,
	"lng" NUMERIC(10,7) NULL DEFAULT NULL,
	"service_radius_km" NUMERIC(8,2) NULL DEFAULT 13,
	PRIMARY KEY ("id"),
	CONSTRAINT "branches_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_branches_office" ON "" ("office_id");;

-- Dumping data for table public.branches: -1 rows
INSERT INTO "branches" ("id", "office_id", "name", "address", "city", "state", "pincode", "phone", "email", "is_primary", "is_active", "created_at", "updated_at", "lat", "lng", "service_radius_km") VALUES
	('0a7f6519-94d8-4688-97a9-a4bcdb82f438', 'a95b268a-da9d-4161-b68a-7b9bf9e14a3f', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, 'true', 'true', '2026-07-04 11:23:26.343711', '2026-07-04 11:23:26.343711', NULL, NULL, 13.00),
	('46d7e569-7cdf-4bf1-84d8-a63834ae3784', 'd5cd99a0-5e61-4b8f-818e-7cee4855ec89', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, 'true', 'true', '2026-07-04 11:23:25.545354', '2026-07-04 11:23:25.545354', NULL, NULL, 13.00),
	('64e22e3f-6663-4ba5-a56d-abfd0c6802fc', '35329240-859e-4d67-a256-53eb2b96cd58', 'XGoo Kondapur', '', '', '', '', '', '', 'true', 'true', '2026-07-04 11:20:02.066877', '2026-07-04 11:24:19.171', NULL, NULL, 13.00),
	('9e48e66a-29bd-4df9-b060-740954ed6df6', '3a6731b5-f20e-4608-8e4d-71b7aa69ebd3', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, 'true', 'true', '2026-07-04 11:23:25.945317', '2026-07-04 11:23:25.945317', NULL, NULL, 13.00),
	('add44b50-c356-43a6-9939-503d83f092e5', 'f28118f8-c1c9-46e0-a415-8c6c5e03a9fe', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, 'true', 'true', '2026-07-04 11:23:22.907362', '2026-07-04 11:23:22.907362', NULL, NULL, 13.00),
	('e7841873-f6da-46ae-92b7-e6e6a5ea0ec2', '409deea0-9e78-4393-979b-753fc582e907', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, 'true', 'true', '2026-07-04 11:23:24.804708', '2026-07-04 11:23:24.804708', NULL, NULL, 13.00),
	('eaad637e-af32-4fe4-b57d-3e6f9bd1c7a4', '0f808bf9-0aa0-4a53-8833-5362a67e2596', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, 'true', 'true', '2026-07-04 16:59:15.693387', '2026-07-04 16:59:15.693387', NULL, NULL, 13.00);

-- Dumping structure for table public.business_daily_jobs
CREATE TABLE IF NOT EXISTS "business_daily_jobs" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"customer_user_id" VARCHAR NOT NULL,
	"destination_id" VARCHAR NULL DEFAULT NULL,
	"job_date" VARCHAR(10) NOT NULL,
	"receiver_name" VARCHAR(255) NOT NULL,
	"receiver_phone" VARCHAR(20) NOT NULL,
	"receiver_address" TEXT NOT NULL,
	"receiver_city" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_state" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"weight" NUMERIC(10,2) NULL DEFAULT 1,
	"number_of_pieces" INTEGER NOT NULL DEFAULT 1,
	"content_description" TEXT NOT NULL DEFAULT 'Daily courier',
	"status" VARCHAR(20) NOT NULL DEFAULT 'planned',
	"booking_request_id" VARCHAR NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"receiver_address_line2" TEXT NULL DEFAULT NULL,
	"shipment_type" VARCHAR(30) NOT NULL DEFAULT 'domestic',
	"destination_country" VARCHAR(100) NULL DEFAULT NULL,
	"xgoo_order_id" VARCHAR(32) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "business_daily_jobs_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "business_daily_jobs_customer_user_id_customer_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "business_daily_jobs_destination_id_business_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "business_destinations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_business_daily_jobs_user_date" ON "" ("customer_user_id", "job_date");;

-- Dumping data for table public.business_daily_jobs: -1 rows
INSERT INTO "business_daily_jobs" ("id", "customer_user_id", "destination_id", "job_date", "receiver_name", "receiver_phone", "receiver_address", "receiver_city", "receiver_state", "receiver_pincode", "weight", "number_of_pieces", "content_description", "status", "booking_request_id", "created_at", "updated_at", "receiver_address_line2", "shipment_type", "destination_country", "xgoo_order_id") VALUES
	('019b4e0d-bc89-4326-90b5-c0c6c8c21af2', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', '41465e03-e869-4262-9efb-bb67267e573f', '2026-09-15', 'Sanjeev Nihal', '09160711252', 'Flat Non 202, Twin Towers, West Block, Simhapuri Colony, Bachupally, Bowrempet', 'K.V.Rangareddy', NULL, NULL, 10.00, 2, 'gifts', 'planned', NULL, '2026-09-15 07:34:57.260324', '2026-09-15 07:34:57.260324', NULL, 'domestic', NULL, NULL),
	('0e4af5b3-ab9e-4856-b012-99d4a9746c2c', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'b3461647-d9c9-4a2d-823a-065b2b74e1ed', '2026-09-28', 'Sandeep', '09666669493', '9amma Mandi Restaurant, beside Noma Talkie''s, NTR Nagar, Mallapur, Secunderabad, Telangana 500076', 'Hyderabad', 'Telangana', '500043', 1.00, 1, 'Sarees from estillo', 'planned', NULL, '2026-09-28 12:05:39.508559', '2026-09-28 12:05:39.508559', NULL, 'domestic', NULL, 'XGHS2809260003'),
	('2281dbbe-9df1-4746-8549-f55516afe562', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'b373622b-b268-4afc-b661-be5009f2a9c5', '2026-09-28', 'ID Check Buyer', '9876500123', '12 Test Street, Kondapur', 'Hyderabad', NULL, '500084', 1.00, 1, 'Gift hamper', 'planned', NULL, '2026-09-28 12:05:38.33108', '2026-09-28 12:05:38.33108', NULL, 'domestic', NULL, 'XGHS2809260004'),
	('467330e6-93e5-473c-9dac-fec23a040375', 'e0625663-f0e6-4554-bbfe-0e3324be7961', '6dc18d76-91f5-415e-8726-2e9cb50193a8', '2026-09-11', 'Tailor Shop', '9876543210', 'Ameerpet Main Road', 'Hyderabad', NULL, NULL, 1.00, 1, 'Daily courier', 'skipped', NULL, '2026-09-11 09:07:16.37071', '2026-09-11 09:07:44.902', NULL, 'domestic', NULL, NULL),
	('5ae622a1-62f8-4355-8d56-22acace1db03', 'e0625663-f0e6-4554-bbfe-0e3324be7961', '337ab209-9286-4727-805e-7a16786ba856', '2026-09-11', 'Warehouse Hub', '9966032234', 'Jeedimetla Industrial Area', 'Hyderabad', NULL, NULL, 1.00, 1, 'Daily courier', 'submitted', '778c471d-b000-4622-b1d8-6e15b91a7729', '2026-09-11 09:07:16.37071', '2026-09-11 09:08:11.394', NULL, 'domestic', NULL, NULL),
	('6fbfb89c-0d10-403b-8aee-e2043edfab8f', '4adc8dc8-580e-4ba7-b646-072a923aa8c4', 'd0941673-9f3a-475e-9592-23ef0da50b93', '2026-09-11', 'M.Gopal 7980755799', '07980755799', 'Door no-15-181/5, 4th floor ,Renuka nilayam 1 apartment, vasistha colony
Sai nagar near Bose bomma centre, yanamalakuduru ,vijayawada ,pin- 520007', 'Vijayawada', 'Andhra pradesh', '520007', 1.00, 1, 'Daily courier', 'planned', NULL, '2026-09-11 12:51:01.730895', '2026-09-11 12:51:01.730895', NULL, 'domestic', NULL, NULL),
	('9a7ebbf4-c3ea-4357-a76d-68bbf50993e8', '4adc8dc8-580e-4ba7-b646-072a923aa8c4', '3673c517-a2b0-4c4a-be5e-b7535a9c7e3a', '2026-09-11', 'ANVI SAREES', '09966032234', '1000 PILLARS SWASTHIK, FLAT NO 101, NEW CYBER VALLEY
NEW HAFEEZPET', 'Hyderabad', 'Telangana', '500049', 1.00, 1, 'Daily courier', 'planned', NULL, '2026-09-11 12:50:58.254693', '2026-09-11 12:50:58.254693', NULL, 'domestic', NULL, NULL),
	('e0ef8781-3ac5-47c7-a45a-c7f36519da75', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', '45f6098c-11ca-4ed8-a7e5-1afc76861c76', '2026-09-28', 'Label Check Buyer', '9876500789', '22 Test Street, Kondapur', 'Hyderabad', 'Telangana', '500084', 1.00, 1, 'Sarees', 'planned', NULL, '2026-09-28 12:05:34.765116', '2026-09-28 12:05:34.765116', NULL, 'domestic', NULL, 'XGHS2809260006'),
	('ee5d62db-3feb-46bc-a00a-ae140f8e46ba', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'a90f227e-dfc5-448a-9e60-05ec97a1d65b', '2026-09-28', 'Second ID Buyer', '9876500456', '9amma Mandi Restaurant', 'Hyderabad', NULL, '500043', 1.00, 1, 'Clothes', 'planned', NULL, '2026-09-28 12:05:35.970182', '2026-09-28 12:05:35.970182', NULL, 'domestic', NULL, 'XGHS2809260005'),
	('ffcbe603-0eb7-4c6b-8526-7253edefc7c5', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'ce8cc9f0-06cc-4ad1-9e44-2384bdd7fd9d', '2026-09-28', 'ID Check Buyer', '9876500123', '12 Test Street, Kondapur', 'Hyderabad', NULL, '500084', 1.00, 1, 'Gift hamper', 'planned', NULL, '2026-09-28 12:05:37.153992', '2026-09-28 12:05:37.153992', NULL, 'domestic', NULL, 'XGHS2809260001');

-- Dumping structure for table public.business_destinations
CREATE TABLE IF NOT EXISTS "business_destinations" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"customer_user_id" VARCHAR NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"phone" VARCHAR(20) NOT NULL,
	"address" TEXT NOT NULL,
	"city" VARCHAR(100) NULL DEFAULT NULL,
	"state" VARCHAR(100) NULL DEFAULT NULL,
	"pincode" VARCHAR(10) NULL DEFAULT NULL,
	"notes" TEXT NULL DEFAULT NULL,
	"recurring" BOOLEAN NOT NULL DEFAULT true,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"address_line2" TEXT NULL DEFAULT NULL,
	"shipment_type" VARCHAR(30) NOT NULL DEFAULT 'domestic',
	"destination_country" VARCHAR(100) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "business_destinations_customer_user_id_customer_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_business_destinations_user" ON "" ("customer_user_id");;

-- Dumping data for table public.business_destinations: -1 rows
INSERT INTO "business_destinations" ("id", "customer_user_id", "name", "phone", "address", "city", "state", "pincode", "notes", "recurring", "created_at", "updated_at", "address_line2", "shipment_type", "destination_country") VALUES
	('05eed975-f687-4f37-ab3e-af1f50325867', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'Test Buyer', '9876543210', '12 Test Street, Kondapur', 'Hyderabad', NULL, '500084', 'Gift hamper', 'false', '2026-09-28 10:25:06.527257', '2026-09-28 10:25:06.527257', NULL, 'domestic', NULL),
	('337ab209-9286-4727-805e-7a16786ba856', 'e0625663-f0e6-4554-bbfe-0e3324be7961', 'Warehouse Hub', '9966032234', 'Jeedimetla Industrial Area', 'Hyderabad', NULL, NULL, NULL, 'true', '2026-09-11 09:04:24.33045', '2026-09-11 09:04:24.33045', NULL, 'domestic', NULL),
	('3673c517-a2b0-4c4a-be5e-b7535a9c7e3a', '4adc8dc8-580e-4ba7-b646-072a923aa8c4', 'ANVI SAREES', '09966032234', '1000 PILLARS SWASTHIK, FLAT NO 101, NEW CYBER VALLEY
NEW HAFEEZPET', 'Hyderabad', 'Telangana', '500049', NULL, 'true', '2026-09-11 12:50:19.051453', '2026-09-11 12:50:19.051453', NULL, 'domestic', NULL),
	('41465e03-e869-4262-9efb-bb67267e573f', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'Sanjeev Nihal', '09160711252', 'Flat Non 202, Twin Towers, West Block, Simhapuri Colony, Bachupally, Bowrempet', 'K.V.Rangareddy', NULL, NULL, NULL, 'false', '2026-09-13 19:00:02.393122', '2026-09-13 19:00:02.393122', NULL, 'domestic', NULL),
	('45f6098c-11ca-4ed8-a7e5-1afc76861c76', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'Label Check Buyer', '9876500789', '22 Test Street, Kondapur', 'Hyderabad', 'Telangana', '500084', 'Sarees', 'false', '2026-09-28 11:03:07.020614', '2026-09-28 11:03:07.020614', NULL, 'domestic', NULL),
	('6dc18d76-91f5-415e-8726-2e9cb50193a8', 'e0625663-f0e6-4554-bbfe-0e3324be7961', 'Tailor Shop', '9876543210', 'Ameerpet Main Road', 'Hyderabad', NULL, NULL, NULL, 'true', '2026-09-11 09:07:02.331826', '2026-09-11 09:07:02.331826', NULL, 'domestic', NULL),
	('a90f227e-dfc5-448a-9e60-05ec97a1d65b', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'Second ID Buyer', '9876500456', '9amma Mandi Restaurant', 'Hyderabad', NULL, '500043', 'Clothes', 'false', '2026-09-28 11:02:36.15153', '2026-09-28 11:02:36.15153', NULL, 'domestic', NULL),
	('b3461647-d9c9-4a2d-823a-065b2b74e1ed', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'Sandeep', '09666669493', '9amma Mandi Restaurant, beside Noma Talkie''s, NTR Nagar, Mallapur, Secunderabad, Telangana 500076', 'Hyderabad', 'Telangana', '500043', 'Sarees from estillo', 'false', '2026-09-28 10:45:52.258378', '2026-09-28 10:45:52.258378', NULL, 'domestic', NULL),
	('b373622b-b268-4afc-b661-be5009f2a9c5', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'ID Check Buyer', '9876500123', '12 Test Street, Kondapur', 'Hyderabad', NULL, '500084', 'Gift hamper', 'false', '2026-09-28 11:01:41.083937', '2026-09-28 11:01:41.083937', NULL, 'domestic', NULL),
	('c6d8a6a9-65c8-4854-9858-5aebec5fa61a', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'Sandeep', '09666669493', '9amma Mandi Restaurant, beside Noma Talkie''s, NTR Nagar, Mallapur, Secunderabad, Telangana 500076', 'K.V.Rangareddy', 'Telangana', '500076', NULL, 'false', '2026-09-13 18:32:57.804863', '2026-09-13 18:32:57.804863', NULL, 'domestic', NULL),
	('ce8cc9f0-06cc-4ad1-9e44-2384bdd7fd9d', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'ID Check Buyer', '9876500123', '12 Test Street, Kondapur', 'Hyderabad', NULL, '500084', 'Gift hamper', 'false', '2026-09-28 11:02:22.12701', '2026-09-28 11:02:22.12701', NULL, 'domestic', NULL),
	('d0941673-9f3a-475e-9592-23ef0da50b93', '4adc8dc8-580e-4ba7-b646-072a923aa8c4', 'M.Gopal 7980755799', '07980755799', 'Door no-15-181/5, 4th floor ,Renuka nilayam 1 apartment, vasistha colony
Sai nagar near Bose bomma centre, yanamalakuduru ,vijayawada ,pin- 520007', 'Vijayawada', 'Andhra pradesh', '520007', NULL, 'true', '2026-09-11 12:50:23.90001', '2026-09-11 12:50:23.90001', NULL, 'domestic', NULL);

-- Dumping structure for table public.business_orders
CREATE TABLE IF NOT EXISTS "business_orders" (
	"id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::text,
	"customer_user_id" VARCHAR NOT NULL,
	"destination_id" VARCHAR NULL DEFAULT NULL,
	"channel" VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
	"receiver_name" VARCHAR(255) NOT NULL,
	"receiver_phone" VARCHAR(20) NOT NULL,
	"receiver_address" TEXT NOT NULL,
	"receiver_city" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_state" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"content_description" TEXT NOT NULL DEFAULT 'Store order',
	"weight" NUMERIC(10,2) NULL DEFAULT 1,
	"number_of_pieces" INTEGER NOT NULL DEFAULT 1,
	"notes" TEXT NULL DEFAULT NULL,
	"status" VARCHAR(20) NOT NULL DEFAULT 'open',
	"daily_job_id" VARCHAR NULL DEFAULT NULL,
	"booking_request_id" VARCHAR NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"receiver_address_line2" TEXT NULL DEFAULT NULL,
	"shipment_type" VARCHAR(30) NOT NULL DEFAULT 'domestic',
	"destination_country" VARCHAR(100) NULL DEFAULT NULL,
	"xgoo_order_id" VARCHAR(32) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("xgoo_order_id"),
	CONSTRAINT "business_orders_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "business_orders_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "business_orders_daily_job_id_fkey" FOREIGN KEY ("daily_job_id") REFERENCES "business_daily_jobs" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "business_orders_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "business_destinations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_business_orders_user" ON "" ("customer_user_id");;

-- Dumping data for table public.business_orders: 5 rows
INSERT INTO "business_orders" ("id", "customer_user_id", "destination_id", "channel", "receiver_name", "receiver_phone", "receiver_address", "receiver_city", "receiver_state", "receiver_pincode", "content_description", "weight", "number_of_pieces", "notes", "status", "daily_job_id", "booking_request_id", "created_at", "updated_at", "receiver_address_line2", "shipment_type", "destination_country", "xgoo_order_id") VALUES
	('164dcd17-66f3-42d1-a5ca-1451aa85b574', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'a90f227e-dfc5-448a-9e60-05ec97a1d65b', 'instagram', 'Second ID Buyer', '9876500456', '9amma Mandi Restaurant', 'Hyderabad', NULL, '500043', 'Clothes', 1.00, 1, 'Clothes', 'pickup_requested', 'ee5d62db-3feb-46bc-a00a-ae140f8e46ba', NULL, '2026-09-28 11:02:36.859516', '2026-09-28 12:05:35.902', NULL, 'domestic', NULL, 'XGHS2809260005'),
	('1f0768e2-0e4b-4b71-b48f-0ea62267daec', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', '45f6098c-11ca-4ed8-a7e5-1afc76861c76', 'whatsapp', 'Label Check Buyer', '9876500789', '22 Test Street, Kondapur', 'Hyderabad', 'Telangana', '500084', 'Sarees', 1.00, 1, 'Sarees', 'pickup_requested', 'e0ef8781-3ac5-47c7-a45a-c7f36519da75', NULL, '2026-09-28 11:03:07.762492', '2026-09-28 12:05:34.724', NULL, 'domestic', NULL, 'XGHS2809260006'),
	('54486687-db44-4ea5-8dcf-f64f15aee3fa', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'c6d8a6a9-65c8-4854-9858-5aebec5fa61a', 'whatsapp', 'Sandeep', '09666669493', '9amma Mandi Restaurant, beside Noma Talkie''s, NTR Nagar, Mallapur, Secunderabad, Telangana 500076', 'K.V.Rangareddy', 'Telangana', '500076', 'Clothes', 15.00, 10, NULL, 'open', NULL, NULL, '2026-09-13 18:32:57.937922', '2026-09-13 18:32:57.937922', NULL, 'domestic', NULL, 'XGHS1409260001'),
	('544a3e8e-341c-4101-bbb4-5567d21ff591', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'ce8cc9f0-06cc-4ad1-9e44-2384bdd7fd9d', 'whatsapp', 'ID Check Buyer', '9876500123', '12 Test Street, Kondapur', 'Hyderabad', NULL, '500084', 'Gift hamper', 1.00, 1, 'Gift hamper', 'pickup_requested', 'ffcbe603-0eb7-4c6b-8526-7253edefc7c5', NULL, '2026-09-28 11:02:23.849658', '2026-09-28 12:05:37.084', NULL, 'domestic', NULL, 'XGHS2809260001'),
	('554b7ae1-27d1-4b16-ac10-50ec34dd6766', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', '41465e03-e869-4262-9efb-bb67267e573f', 'whatsapp', 'Sanjeev Nihal', '09160711252', 'Flat Non 202, Twin Towers, West Block, Simhapuri Colony, Bachupally, Bowrempet', 'K.V.Rangareddy', NULL, NULL, 'gifts', 10.00, 2, NULL, 'pickup_requested', '019b4e0d-bc89-4326-90b5-c0c6c8c21af2', NULL, '2026-09-13 19:00:02.588196', '2026-09-15 07:34:58.905', NULL, 'domestic', NULL, 'XGHS1409260002'),
	('642df6f4-467c-4011-b0d6-64d19f02771b', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'b373622b-b268-4afc-b661-be5009f2a9c5', 'whatsapp', 'ID Check Buyer', '9876500123', '12 Test Street, Kondapur', 'Hyderabad', NULL, '500084', 'Gift hamper', 1.00, 1, 'Gift hamper', 'pickup_requested', '2281dbbe-9df1-4746-8549-f55516afe562', NULL, '2026-09-28 11:01:41.28487', '2026-09-28 12:05:38.262', NULL, 'domestic', NULL, 'XGHS2809260004'),
	('953c66f1-a978-427d-9ea7-21e7f338bf18', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', '05eed975-f687-4f37-ab3e-af1f50325867', 'whatsapp', 'Test Buyer', '9876543210', '12 Test Street, Kondapur', 'Hyderabad', NULL, '500084', 'Gift hamper', 1.00, 1, 'Gift hamper', 'open', NULL, NULL, '2026-09-28 10:25:06.654015', '2026-09-28 10:25:06.654015', NULL, 'domestic', NULL, 'XGHS2809260002'),
	('b65d27c6-cca0-41dd-8980-e1c6e636fe5d', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'b3461647-d9c9-4a2d-823a-065b2b74e1ed', 'instagram', 'Sandeep', '09666669493', '9amma Mandi Restaurant, beside Noma Talkie''s, NTR Nagar, Mallapur, Secunderabad, Telangana 500076', 'Hyderabad', 'Telangana', '500043', 'Sarees from estillo', 1.00, 1, 'Sarees from estillo', 'pickup_requested', '0e4af5b3-ab9e-4856-b012-99d4a9746c2c', NULL, '2026-09-28 10:45:52.390944', '2026-09-28 12:05:39.438', NULL, 'domestic', NULL, 'XGHS2809260003');

-- Dumping structure for table public.business_profiles
CREATE TABLE IF NOT EXISTS "business_profiles" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"customer_user_id" VARCHAR NOT NULL,
	"company_name" VARCHAR(255) NOT NULL DEFAULT '',
	"store_type" VARCHAR(50) NOT NULL DEFAULT '',
	"gst_number" VARCHAR(20) NULL DEFAULT NULL,
	"pickup_address" TEXT NOT NULL DEFAULT '',
	"pickup_city" VARCHAR(100) NULL DEFAULT NULL,
	"pickup_state" VARCHAR(100) NULL DEFAULT NULL,
	"pickup_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"pickup_lat" NUMERIC(10,7) NULL DEFAULT NULL,
	"pickup_lng" NUMERIC(10,7) NULL DEFAULT NULL,
	"pickup_time_slot" VARCHAR(40) NULL DEFAULT NULL,
	"pickup_phone" VARCHAR(20) NULL DEFAULT NULL,
	"weekdays" JSONB NOT NULL DEFAULT '{"fri": true, "mon": true, "sat": true, "sun": false, "thu": true, "tue": true, "wed": true}',
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"store_name" VARCHAR(255) NOT NULL DEFAULT '',
	"verification_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
	"verification_note" TEXT NULL DEFAULT NULL,
	"verified_at" TIMESTAMP NULL DEFAULT NULL,
	"verified_by_user_id" VARCHAR NULL DEFAULT NULL,
	"pickup_style" VARCHAR(20) NOT NULL DEFAULT 'standing',
	"billing_cycle" VARCHAR(20) NOT NULL DEFAULT 'weekly',
	PRIMARY KEY ("id"),
	UNIQUE ("customer_user_id"),
	CONSTRAINT "business_profiles_customer_user_id_customer_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Dumping data for table public.business_profiles: 2 rows
INSERT INTO "business_profiles" ("id", "customer_user_id", "company_name", "store_type", "gst_number", "pickup_address", "pickup_city", "pickup_state", "pickup_pincode", "pickup_lat", "pickup_lng", "pickup_time_slot", "pickup_phone", "weekdays", "created_at", "updated_at", "store_name", "verification_status", "verification_note", "verified_at", "verified_by_user_id", "pickup_style", "billing_cycle") VALUES
	('6e6e8c23-a84e-4ab3-b929-4f439b1cd5ff', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'Harshini Store', 'restaurant', '158651654198652', 'Flat Non 202, Twin Towers, West Block, Simhapuri Colony, Bachupally, Bowrempet', 'K.V.Rangareddy', 'Telangana', '500043', NULL, NULL, '14:00', '09160711252', '{"fri": true, "mon": true, "sat": true, "sun": false, "thu": true, "tue": true, "wed": true}', '2026-09-13 16:24:49.462357', '2026-09-28 12:06:36.607', 'Harshini Store', 'approved', NULL, '2026-09-13 16:45:09.088', '203ef505-318f-4d11-a2b6-931a5f022980', 'on_demand', 'weekly'),
	('7c51c2b6-349d-4c5e-ae55-140f19dc2b5e', 'b66c47dd-e7ea-4183-bfb3-1e25e2bc6ff4', '', '', NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"fri": true, "mon": true, "sat": true, "sun": false, "thu": true, "tue": true, "wed": true}', '2026-09-13 16:02:30.998776', '2026-09-13 16:02:30.998776', '', 'pending', NULL, NULL, NULL, 'standing', 'weekly'),
	('7cea1dbf-cae8-486d-9465-e994f578ae40', '4adc8dc8-580e-4ba7-b646-072a923aa8c4', 'Xgoo', 'cloth_store', NULL, 'Satyam Valley, Villa No 2, Rajeev Gandhi Nagar, Bachupally, Hyderabad', 'Hyderabad', NULL, NULL, NULL, NULL, '17:00', '9160711252', '{"fri": true, "mon": true, "sat": true, "sun": false, "thu": true, "tue": true, "wed": true}', '2026-09-11 12:16:51.894945', '2026-09-11 12:49:30.962', 'Xgoo', 'approved', NULL, '2026-09-13 16:23:59.665289', NULL, 'standing', 'weekly'),
	('de01107f-6546-4369-a9e9-cf0404ad0d39', 'e0625663-f0e6-4554-bbfe-0e3324be7961', 'Kondapur Cloth House', 'cloth_store', NULL, 'Gachibowli Main Road, Kondapur', 'Hyderabad', NULL, NULL, NULL, NULL, '09:00', '9887766554', '{"fri": true, "mon": true, "sat": true, "sun": false, "thu": true, "tue": true, "wed": true}', '2026-09-11 09:01:12.896461', '2026-09-11 09:02:15.216', 'Kondapur Cloth House', 'approved', NULL, '2026-09-13 16:23:59.665289', NULL, 'standing', 'weekly');

-- Dumping structure for table public.business_settlements
CREATE TABLE IF NOT EXISTS "business_settlements" (
	"id" VARCHAR NOT NULL DEFAULT (gen_random_uuid())::text,
	"customer_user_id" VARCHAR NOT NULL,
	"billing_cycle" VARCHAR(20) NOT NULL,
	"period_start" TIMESTAMP NOT NULL,
	"period_end" TIMESTAMP NOT NULL,
	"amount" NUMERIC(12,2) NOT NULL,
	"shipment_count" INTEGER NOT NULL DEFAULT 0,
	"payment_mode" VARCHAR(30) NOT NULL,
	"payment_status" VARCHAR(20) NOT NULL DEFAULT 'completed',
	"transaction_reference" VARCHAR(100) NULL DEFAULT NULL,
	"notes" TEXT NULL DEFAULT NULL,
	"paid_at" TIMESTAMP NULL DEFAULT now(),
	"created_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	CONSTRAINT "business_settlements_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_business_settlements_user" ON "" ("customer_user_id");;

-- Dumping data for table public.business_settlements: -1 rows

-- Dumping structure for table public.conversations
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" SERIAL NOT NULL,
	"title" TEXT NOT NULL,
	"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("id")
);

-- Dumping data for table public.conversations: -1 rows

-- Dumping structure for table public.courier_partners
CREATE TABLE IF NOT EXISTS "courier_partners" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"code" VARCHAR(20) NOT NULL,
	"contact_person" VARCHAR(255) NULL DEFAULT NULL,
	"phone" VARCHAR(20) NULL DEFAULT NULL,
	"email" VARCHAR(255) NULL DEFAULT NULL,
	"base_rate_air" NUMERIC(10,2) NULL DEFAULT '0',
	"base_rate_surface" NUMERIC(10,2) NULL DEFAULT '0',
	"rate_per_kg_air" NUMERIC(10,2) NULL DEFAULT '0',
	"rate_per_kg_surface" NUMERIC(10,2) NULL DEFAULT '0',
	"awb_prefix" VARCHAR(20) NULL DEFAULT NULL,
	"awb_range_start" VARCHAR(50) NULL DEFAULT NULL,
	"awb_range_end" VARCHAR(50) NULL DEFAULT NULL,
	"is_active" BOOLEAN NULL DEFAULT true,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"is_demo" BOOLEAN NULL DEFAULT false,
	"margin_amount" NUMERIC(10,2) NULL DEFAULT '0',
	"margin_percent" NUMERIC(6,2) NULL DEFAULT '0',
	"use_tariff_pricing" BOOLEAN NULL DEFAULT true,
	"portal_url" VARCHAR(500) NULL DEFAULT NULL,
	"booking_method" VARCHAR(30) NOT NULL DEFAULT 'browser_automation',
	"automation_enabled" BOOLEAN NULL DEFAULT true,
	PRIMARY KEY ("id"),
	CONSTRAINT "courier_partners_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_courier_partners_office" ON "" ("office_id");;

-- Dumping data for table public.courier_partners: -1 rows
INSERT INTO "courier_partners" ("id", "office_id", "name", "code", "contact_person", "phone", "email", "base_rate_air", "base_rate_surface", "rate_per_kg_air", "rate_per_kg_surface", "awb_prefix", "awb_range_start", "awb_range_end", "is_active", "created_at", "updated_at", "is_demo", "margin_amount", "margin_percent", "use_tariff_pricing", "portal_url", "booking_method", "automation_enabled") VALUES
	('0d4ab644-6c61-445b-9758-ac6fd500b776', '35329240-859e-4d67-a256-53eb2b96cd58', 'FedEx India', 'FEDEX', 'Priya Patel', '9876543211', 'fedex@example.com', 150.00, 80.00, 90.00, 50.00, 'FX', NULL, NULL, 'true', '2026-02-05 01:47:53.633', '2026-02-05 01:47:53.633', 'false', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('15999cf8-9033-4306-99aa-10afd3f5f764', '35329240-859e-4d67-a256-53eb2b96cd58', 'DTDC Express', 'DTDC', 'Rahul Sharma', '9876543210', 'dtdc@example.com', 100.00, 50.00, 60.00, 30.00, 'DT', NULL, NULL, 'true', '2026-07-04 17:00:08.293922', '2026-07-04 17:00:08.293922', 'true', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('2bc9b1c9-852d-46c0-bd85-72757a6d0836', 'f28118f8-c1c9-46e0-a415-8c6c5e03a9fe', 'FRANCH EXPRESS COURIER', 'FRANCH', 'KRISHNA MURTHY', '9347138235', 'krishnamurthysingari@gmail.com', 200.00, 150.00, 150.00, 80.00, NULL, NULL, NULL, 'true', '2026-04-04 07:47:28.959396', '2026-04-04 07:47:28.959396', 'false', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('405a9f63-e7c2-4b17-aa23-dbffa8e95666', '35329240-859e-4d67-a256-53eb2b96cd58', 'World First Courier', 'WF', '', '', '', 0.00, 0.00, 0.00, 0.00, '', '', '', 'true', '2026-07-16 19:11:03.837972', '2026-08-18 20:00:54.549', 'false', 0.00, 0.00, 'true', 'https://xpresion.worldfirst.in/', 'browser_automation', 'true'),
	('5026ddb3-bc3f-4817-9c02-33a141bb56e9', '35329240-859e-4d67-a256-53eb2b96cd58', 'Delhivery', 'DEL', 'Neha Singh', '9876543213', 'delhivery@example.com', 90.00, 45.00, 55.00, 25.00, 'DL', '', '', 'true', '2026-07-04 17:00:08.703235', '2026-08-18 19:55:13.293', 'true', 0.00, 0.00, 'true', 'https://one.delhivery.com/home', 'api', 'true'),
	('5921462c-4e6f-46e4-940f-5fa56d7225b4', '35329240-859e-4d67-a256-53eb2b96cd58', 'Delhivery', 'DEL', 'Neha Singh', '9876543213', 'delhivery@example.com', 90.00, 45.00, 55.00, 25.00, 'DL', NULL, NULL, 'true', '2026-02-05 01:47:53.638', '2026-02-05 01:47:53.638', 'false', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('8686cc80-9bea-45b1-9ce2-dc32d86cc6d7', '35329240-859e-4d67-a256-53eb2b96cd58', 'Blue Dart', 'BD', 'Amit Kumar', '9876543212', 'bluedart@example.com', 120.00, 60.00, 75.00, 40.00, 'BD', NULL, NULL, 'true', '2026-02-05 01:47:53.636', '2026-02-05 01:47:53.636', 'false', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('985a1a59-666d-42bd-9814-a629b455ad18', '35329240-859e-4d67-a256-53eb2b96cd58', 'Blue Dart', 'BD', 'Amit Kumar', '9876543212', 'bluedart@example.com', 120.00, 60.00, 75.00, 40.00, 'BD', NULL, NULL, 'true', '2026-07-04 17:00:08.567161', '2026-07-04 17:00:08.567161', 'true', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('b9597207-11c3-4e80-a0e7-896f3a8e8353', '35329240-859e-4d67-a256-53eb2b96cd58', 'FedEx India', 'FEDEX', 'Priya Patel', '9876543211', 'fedex@example.com', 150.00, 80.00, 90.00, 50.00, 'FX', NULL, NULL, 'true', '2026-07-04 17:00:08.432096', '2026-07-04 17:00:08.432096', 'true', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('bded75e7-9547-4b41-b2d4-fa4a5483cceb', 'f28118f8-c1c9-46e0-a415-8c6c5e03a9fe', 'DELIVARYONE', 'DELIVARY', 'KRISHNA MURTHY', '9347138235', 'krishnamurthysingari@gmail.com', 200.00, 150.00, 150.00, 100.00, NULL, NULL, NULL, 'true', '2026-04-04 07:48:38.389372', '2026-04-04 07:48:38.389372', 'false', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('c8e50281-3154-4668-91d1-dd9404babff1', '35329240-859e-4d67-a256-53eb2b96cd58', 'DTDC Express', 'DTDC', 'Rahul Sharma', '9876543210', 'dtdc@example.com', 100.00, 50.00, 60.00, 30.00, 'DT', NULL, NULL, 'true', '2026-02-05 01:47:53.63', '2026-02-05 01:47:53.63', 'false', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('d2e6c3c8-001d-4f00-9cab-30b53db9c395', 'f28118f8-c1c9-46e0-a415-8c6c5e03a9fe', 'SHREE TIRUPATI COURIER', 'TIRUPATI', 'KRISHNA MURTHY', '9347138235', 'krishnamurthysingari@gmail.com', 200.00, 150.00, 150.00, 80.00, NULL, NULL, NULL, 'true', '2026-04-04 07:49:44.502314', '2026-04-04 07:49:44.502314', 'false', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true'),
	('e7bb59b5-c689-4472-ba3f-eb6d705e076c', 'f28118f8-c1c9-46e0-a415-8c6c5e03a9fe', 'ST Couriers', 'ST', 'Krishna Murhty', '9347138235', 'krishnamurthysingari@gmail.com', 200.00, 100.00, 1.00, 1.00, 'XGST', '1000', '9999', 'true', '2026-04-04 06:58:31.033132', '2026-04-04 06:58:31.033132', 'false', 0.00, 0.00, 'true', NULL, 'browser_automation', 'true');

-- Dumping structure for table public.customer_addresses
CREATE TABLE IF NOT EXISTS "customer_addresses" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"customer_user_id" VARCHAR NOT NULL,
	"label" VARCHAR(100) NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"phone" VARCHAR(20) NOT NULL,
	"address" TEXT NOT NULL,
	"city" VARCHAR(100) NULL DEFAULT NULL,
	"state" VARCHAR(100) NULL DEFAULT NULL,
	"pincode" VARCHAR(10) NULL DEFAULT NULL,
	"lat" NUMERIC(10,7) NULL DEFAULT NULL,
	"lng" NUMERIC(10,7) NULL DEFAULT NULL,
	"address_type" VARCHAR(20) NOT NULL DEFAULT 'sender',
	"is_default" BOOLEAN NULL DEFAULT false,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"address_line2" TEXT NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "customer_addresses_customer_user_id_customer_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_customer_addresses_user" ON "" ("customer_user_id");;

-- Dumping data for table public.customer_addresses: -1 rows
INSERT INTO "customer_addresses" ("id", "customer_user_id", "label", "name", "phone", "address", "city", "state", "pincode", "lat", "lng", "address_type", "is_default", "created_at", "address_line2") VALUES
	('0886fb71-9ae7-4502-acec-4ff7c3ba4a03', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Pickup', 'Nihal', '7799846684', 'Bowrampet', 'Dundigal mandal', 'Telangana', '500090', 17.5466727, 78.3937283, 'sender', 'false', '2026-07-13 18:52:11.926254', NULL),
	('147bbc20-a1fb-4cc8-a8e7-732bf701ba36', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Delivery', 'Krishna Murthy', '9966032234', 'Yelahanka', 'Bengaluru', 'Karnataka', '560064', NULL, NULL, 'receiver', 'false', '2026-07-13 18:52:12.300049', NULL),
	('16f3defb-8ad1-43b4-a2e5-6ba24ad4da52', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Pickup', 'Nihal', '7799846684', 'Bowrampet', 'Dundigal mandal', 'Telangana', '500090', 17.5456669, 78.3906467, 'sender', 'false', '2026-07-13 18:54:22.204808', NULL),
	('22c17e6e-7113-40b2-afdc-4f62d217c69e', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Pickup', 'Nihal', '7799846684', 'Satyam Valley, Villa No 2, Rajeev Gandhi Nagar, Bachupally, Hyderabad', 'Hyderabad', 'Telangana', '500090', 17.5458316, 78.3908584, 'sender', 'false', '2026-07-08 18:43:16.81438', NULL),
	('3cceb66e-6c7b-4b70-9762-ce88e44febff', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Delivery', 'Krishna Murthy', '9966032234', 'Yelahanka', 'Bengaluru', 'Karnataka', '560064', NULL, NULL, 'receiver', 'false', '2026-07-13 18:42:44.083529', NULL),
	('4020c554-1ed6-44a2-9d11-4d2177e5e352', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Pickup', 'Nihal', '7799846684', 'Satyam Valley, Villa No 2, Rajeev Gandhi Nagar, Bachupally, Hyderabad', 'Hyderabad', 'Telangana', '500090', 17.5458316, 78.3908584, 'sender', 'false', '2026-07-13 18:42:43.702259', NULL),
	('534c96a7-9d8a-4372-a5e0-039c0dd24248', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Delivery', 'Krishna Murthy', '9966032234', 'Yelahanka', 'Bengaluru', 'Karnataka', '560064', NULL, NULL, 'receiver', 'false', '2026-07-13 18:59:27.24272', NULL),
	('5773c02c-3ff7-487e-9219-6581c09932b7', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Pickup', 'Nihal', '7799846684', 'Bowrampet', 'Dundigal mandal', 'Telangana', '500090', 17.5466727, 78.3937283, 'sender', 'false', '2026-07-13 18:59:26.850827', NULL),
	('9b72c9ce-346e-4129-ad4a-6586e848f05a', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Delivery', 'Krishna Murthy', '9966032234', 'Yelahanka', 'Bengaluru', 'Karnataka', '560064', NULL, NULL, 'receiver', 'false', '2026-07-13 18:54:22.610946', NULL),
	('b1a6b066-9396-493a-9261-5ff8211d22b8', '52fc42de-a976-4165-bad8-f02363d35cfb', 'Delivery', 'SWETHA SINGARI', '9966032234', 'Satyam Valley, Villa No 2, Raj
Bachupally, Qutubullapur', 'K.V.Rangareddy', 'Telangana', '500090', NULL, NULL, 'receiver', 'false', '2026-07-08 18:43:17.221253', NULL);

-- Dumping structure for table public.customer_notifications
CREATE TABLE IF NOT EXISTS "customer_notifications" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"customer_user_id" VARCHAR NOT NULL,
	"title" VARCHAR(255) NOT NULL,
	"body" TEXT NOT NULL,
	"type" VARCHAR(40) NOT NULL DEFAULT 'general',
	"data" JSONB NULL DEFAULT NULL,
	"read_at" TIMESTAMP NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	CONSTRAINT "customer_notifications_customer_user_id_customer_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_customer_notifications_user" ON "" ("customer_user_id");
CREATE INDEX "idx_customer_notifications_created" ON "" ("created_at");;

-- Dumping data for table public.customer_notifications: -1 rows
INSERT INTO "customer_notifications" ("id", "customer_user_id", "title", "body", "type", "data", "read_at", "created_at") VALUES
	('167f26a3-1561-4cb4-a0a6-433f12e130bf', '79a4f427-bb1c-4296-b3d5-57f49cfb6979', 'Booking approved', 'Request #BRMSIW7QL3TV is approved. Pickup confirmation will follow.', 'booking_approved', '{"requestNumber": "BRMSIW7QL3TV", "bookingRequestId": "4a7932eb-bf84-4a8a-ab68-ec7674630b55"}', NULL, '2026-08-18 19:52:41.939622'),
	('9edd729f-bee0-465f-a7e0-aeb3f0053f91', '79a4f427-bb1c-4296-b3d5-57f49cfb6979', 'Booking request received', 'Request #BRMSIW7QL3TV was submitted successfully. XGoo will review it shortly.', 'booking_created', '{"requestNumber": "BRMSIW7QL3TV", "bookingRequestId": "4a7932eb-bf84-4a8a-ab68-ec7674630b55"}', NULL, '2026-08-07 12:00:14.909977'),
	('de8fe8d6-8752-4762-95ce-11a41b33822c', 'e0625663-f0e6-4554-bbfe-0e3324be7961', 'Quote ready', 'Accept the pickup quote for request #BRMTWQH9Q0Q9 — ₹520.', 'quote_sent', '{"acceptToken": "32657783-a00f-4ce3-81ef-c86343480410", "pickupJobId": "16eb73d8-03da-4020-bcf1-a5a93d00bc89", "quotationId": "20768be7-b422-44a9-b8ff-9a6324afa6d3", "bookingRequestId": "778c471d-b000-4622-b1d8-6e15b91a7729"}', NULL, '2026-09-12 19:25:45.484215'),
	('f86751ca-ff9c-42b5-bb21-60290b074350', 'e0625663-f0e6-4554-bbfe-0e3324be7961', 'Daily pickup confirmed', 'Request #BRMTWQH9Q0Q9 is with XGoo for Warehouse Hub.', 'booking_created', '{"requestNumber": "BRMTWQH9Q0Q9", "bookingRequestId": "778c471d-b000-4622-b1d8-6e15b91a7729"}', NULL, '2026-09-11 09:08:11.338842');

-- Dumping structure for table public.customer_otps
CREATE TABLE IF NOT EXISTS "customer_otps" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"phone" VARCHAR(20) NOT NULL,
	"purpose" VARCHAR(20) NOT NULL,
	"code_hash" VARCHAR(255) NOT NULL,
	"expires_at" TIMESTAMP NOT NULL,
	"attempts" INTEGER NOT NULL DEFAULT 0,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id")
)
CREATE INDEX "idx_customer_otps_lookup" ON "" ("office_id", "phone", "purpose");;

-- Dumping data for table public.customer_otps: -1 rows
INSERT INTO "customer_otps" ("id", "office_id", "phone", "purpose", "code_hash", "expires_at", "attempts", "created_at") VALUES
	('3c5ab291-72d7-4331-8afe-618663d9a7ae', '35329240-859e-4d67-a256-53eb2b96cd58', '8297712133', 'register', '$2b$10$fwIEKudbYjL/6hy0xMicuuNNquPx8ibMaeewlLsIQpGzoXMNDy0kK', '2026-09-28 12:54:21.851', 0, '2026-09-28 12:49:22.069112'),
	('78284bab-2301-4492-af48-ecdd50c0d10c', '35329240-859e-4d67-a256-53eb2b96cd58', '8971690163', 'register', '$2b$10$PULm.23tBdeIa3HJYe8D5.fN9Zh45oKQObM4qdi1sgWW7GI7FDbEW', '2026-09-28 12:56:57.222', 0, '2026-09-28 12:51:57.443297');

-- Dumping structure for table public.customer_push_tokens
CREATE TABLE IF NOT EXISTS "customer_push_tokens" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"customer_user_id" VARCHAR NOT NULL,
	"token" VARCHAR(255) NOT NULL,
	"platform" VARCHAR(20) NOT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	UNIQUE ("token"),
	CONSTRAINT "customer_push_tokens_customer_user_id_customer_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_customer_push_tokens_user" ON "" ("customer_user_id");;

-- Dumping data for table public.customer_push_tokens: -1 rows

-- Dumping structure for table public.customer_sessions
CREATE TABLE IF NOT EXISTS "customer_sessions" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"customer_user_id" VARCHAR NOT NULL,
	"token" VARCHAR(255) NOT NULL,
	"expires_at" TIMESTAMP NOT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	UNIQUE ("token"),
	CONSTRAINT "customer_sessions_customer_user_id_customer_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "customer_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_customer_sessions_token" ON "" ("token");
CREATE INDEX "idx_customer_sessions_user" ON "" ("customer_user_id");;

-- Dumping data for table public.customer_sessions: -1 rows
INSERT INTO "customer_sessions" ("id", "customer_user_id", "token", "expires_at", "created_at") VALUES
	('0b10784e-859b-4cbc-b97e-1403fd95c21f', '0449e3af-e18a-4845-8d96-67959eb4bcaf', 'fec1524b-171d-4be3-bd17-55dd8fc94fd1', '2026-03-08 15:54:36.961', '2026-02-06 15:54:36.961'),
	('0cb9505c-494c-433e-8640-e018abdf2476', '52fc42de-a976-4165-bad8-f02363d35cfb', '8e54332b-a707-40b4-a3c2-ed2f781c486a', '2026-08-07 18:02:23.187', '2026-07-08 18:02:24.638383'),
	('17987950-373d-4a3c-b037-55b53094a269', '3f425fc7-ef2e-4ceb-9087-307952c5c459', 'e1853a99-087d-4eef-b1b4-542703b3952e', '2026-08-10 07:57:55.08', '2026-07-11 07:57:55.154299'),
	('1e818426-a410-4e52-bddc-707aa19da72a', '9ea8e23b-c826-48be-8505-4bb091325f2f', 'f0ddbce1-f069-4882-b1d2-8a985f45f37d', '2026-03-15 10:28:09.867', '2026-02-13 10:28:09.868'),
	('257c4799-00de-45f9-a465-f16d592c553c', 'b66c47dd-e7ea-4183-bfb3-1e25e2bc6ff4', '7b445719-3676-486d-80a6-74c4534a36cc', '2026-03-09 01:55:33.085', '2026-02-07 01:55:33.086'),
	('44173c8f-c602-43c9-8406-722f0431fe24', 'ff7c1ca0-99fa-4126-871d-0398a75cea5a', '1cc73c6f-56e7-42be-8da8-11802c5eb639', '2026-10-11 10:11:51.378', '2026-09-11 10:11:51.220318'),
	('645a2729-f95b-43fb-ba2b-d358eaf435d0', 'cdee6b47-8860-4861-9f14-ddbcd52a5554', '7993256e-275d-436a-9c27-e1aaaf3429c0', '2026-03-08 15:57:06.571', '2026-02-06 15:57:06.572'),
	('713fdb1b-49fa-4d6b-964c-00ea00185cb0', 'ff7c1ca0-99fa-4126-871d-0398a75cea5a', '747263cc-f753-41ac-87a6-1f30d2a2f4fa', '2026-10-11 10:12:06.259', '2026-09-11 10:12:06.09656'),
	('858fdf23-7333-43b6-acc7-892e00d8da21', '79a4f427-bb1c-4296-b3d5-57f49cfb6979', 'e868fe97-ac09-436c-a46a-0f346798cb54', '2026-08-18 15:12:58.855', '2026-07-19 15:12:59.036548'),
	('8bd4c4d3-7ed0-44ea-877c-2f3c3a9537fb', '0449e3af-e18a-4845-8d96-67959eb4bcaf', 'd8d645bb-add6-4232-a360-f17f4195adea', '2026-03-08 15:54:32.513', '2026-02-06 15:54:32.514'),
	('93204f2b-e5d2-406e-b1a8-7e40b1829d74', 'cdee6b47-8860-4861-9f14-ddbcd52a5554', 'd435001b-3479-44d5-832c-235e47b5746c', '2026-03-08 15:57:57.227', '2026-02-06 15:57:57.228'),
	('acb79a2b-b640-449a-9edf-1f9d09a93276', '48e28ad1-4927-4dc0-ab14-b9c87bf95713', 'eaa03678-db80-48f7-9d5c-d5c3da4fd798', '2026-10-19 13:58:34.363', '2026-09-19 13:58:35.479066'),
	('b201f61d-db64-41ec-a5d3-618bbd73dfe2', '52fc42de-a976-4165-bad8-f02363d35cfb', '1ffd8aa1-0ac2-4e43-a9b2-094c7cddfac6', '2026-08-10 13:36:24.705', '2026-07-11 13:36:24.777373'),
	('cc01cc08-921a-4393-94d1-cb77f2248477', '3f425fc7-ef2e-4ceb-9087-307952c5c459', 'c426cc40-31ca-47ff-b288-9140de3d1f7b', '2026-10-12 11:14:54.201', '2026-09-12 11:14:54.656662'),
	('ccef2047-567c-4e9b-ad30-fad98547fcca', 'b66c47dd-e7ea-4183-bfb3-1e25e2bc6ff4', 'c6380d50-5cb0-48e2-add6-084fc019df18', '2026-09-24 06:36:39.326', '2026-08-25 06:36:39.429822'),
	('d9cfb810-ddd2-478c-9145-43e0d5a01f6a', 'b66c47dd-e7ea-4183-bfb3-1e25e2bc6ff4', '43ade268-65f0-4c32-be3e-9339c67f96f9', '2026-10-12 10:55:05.603', '2026-09-12 10:55:05.674784'),
	('e4086cf8-00ca-4641-960d-42577e64669a', 'b66c47dd-e7ea-4183-bfb3-1e25e2bc6ff4', '1d3c0eb0-6411-451f-87f7-72a4a7c8f79c', '2026-09-18 04:36:43.448', '2026-08-19 04:36:44.247011'),
	('eca15039-7663-4dd4-9cee-10a465dfb9ce', '39519f98-7507-4df7-9e32-553fed342680', '579e1f00-114c-44b3-9a26-67fcb0f5adcd', '2026-10-28 12:51:14.081', '2026-09-28 12:51:14.151938'),
	('f6e9072b-22b6-44c4-9e7e-16541f038b15', '912e7fef-d2bc-4af6-9313-d78b6d475301', 'c76f4430-5462-43c7-a905-aedb7af9a98b', '2026-03-08 16:08:44.349', '2026-02-06 16:08:44.35'),
	('fbdd2950-2172-40ed-90a8-5d0e01407a37', 'd7cd0c84-701f-4ae9-a73b-053071c212b0', 'fe3c8f3e-9b99-4980-aaf0-5328ad941b9b', '2026-03-08 16:10:49.937', '2026-02-06 16:10:49.938');

-- Dumping structure for table public.customer_users
CREATE TABLE IF NOT EXISTS "customer_users" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"phone" VARCHAR(20) NULL DEFAULT NULL,
	"email" VARCHAR(255) NULL DEFAULT NULL,
	"password_hash" VARCHAR(255) NOT NULL,
	"address" TEXT NULL DEFAULT NULL,
	"city" VARCHAR(100) NULL DEFAULT NULL,
	"state" VARCHAR(100) NULL DEFAULT NULL,
	"pincode" VARCHAR(10) NULL DEFAULT NULL,
	"default_pickup_lat" NUMERIC(10,7) NULL DEFAULT NULL,
	"default_pickup_lng" NUMERIC(10,7) NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"account_type" VARCHAR(20) NOT NULL DEFAULT 'individual',
	"google_id" VARCHAR(255) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "customer_users_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_customer_users_office" ON "" ("office_id");
CREATE INDEX "idx_customer_users_phone" ON "" ("phone");
CREATE INDEX "idx_customer_users_email" ON "" ("email");
CREATE INDEX "idx_customer_users_google" ON "" ("google_id");;

-- Dumping data for table public.customer_users: 12 rows
INSERT INTO "customer_users" ("id", "office_id", "name", "phone", "email", "password_hash", "address", "city", "state", "pincode", "default_pickup_lat", "default_pickup_lng", "created_at", "updated_at", "account_type", "google_id") VALUES
	('0449e3af-e18a-4845-8d96-67959eb4bcaf', '35329240-859e-4d67-a256-53eb2b96cd58', 'Test Customer', '9876543210', 'test@example.com', '$2b$10$nqXNe.lkGpUe5NQY36DzwO1eZfr1ckrqospapHvzG9NlbDeyz2vRm', '123 Main St', 'Mumbai', 'Maharashtra', '400001', NULL, NULL, '2026-02-06 15:54:32.425', '2026-02-06 15:54:32.425', 'business', NULL),
	('39519f98-7507-4df7-9e32-553fed342680', '35329240-859e-4d67-a256-53eb2b96cd58', 'navya', '6301019935', 'xgoo.dev@gmail.com', '$2b$10$Hze4g2sLaEVyrvxfUtSsB.UQq88Klllm1YF5c86vHnRYdpIRqWcRG', 'Ground Floor, Plot No: 130, Subash Chandra Bose Nagar', 'Hyderabad', 'India', '500049', NULL, NULL, '2026-08-23 08:51:13.498792', '2026-09-28 12:51:13.907', 'individual', NULL),
	('3f425fc7-ef2e-4ceb-9087-307952c5c459', '35329240-859e-4d67-a256-53eb2b96cd58', 'Harshini singari', '9014461373', 'harshinisingari@gmail.com', '$2b$10$FEQr01ZAzbZOoq62bgZe8u/7wlVMvuT/fByjkJhqW2WilM5AyklZe', 'Simhapuri colony ', 'Hyderabad ', 'Telangana ', '500043', NULL, NULL, '2026-07-11 07:57:54.95039', '2026-09-12 11:14:54.07', 'individual', NULL),
	('48e28ad1-4927-4dc0-ab14-b9c87bf95713', '35329240-859e-4d67-a256-53eb2b96cd58', 'Harshini Singari', '09160711252', 'harshinisingari@gmail.com', '$2b$10$DUt4Xkb4M2gv5750Rz1WlOr76tm8PIPYrNa.PNn./i.9Arn8G1J/K', 'Flat Non 202, Twin Towers, West Block, Simhapuri Colony, Bachupally, Bowrempet', 'K.V.Rangareddy', 'Telangana', '500043', NULL, NULL, '2026-09-13 16:24:48.369434', '2026-09-28 09:32:09.9', 'business', '8d6f4eab-0af3-4a85-918a-ef7623c6f1b6'),
	('4adc8dc8-580e-4ba7-b646-072a923aa8c4', '35329240-859e-4d67-a256-53eb2b96cd58', 'Xgoo', NULL, 'xgoo.express@gmail.com', '$2b$10$09mUqFPFDBoRq7BwfmqZWeEjRE2EnTocueaUyPw0.ZLqsNSE./8B.', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-11 12:16:51.032265', '2026-09-11 12:16:51.032265', 'business', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('52fc42de-a976-4165-bad8-f02363d35cfb', '35329240-859e-4d67-a256-53eb2b96cd58', 'Nihal', '7799846684', 'sanjeevnihal@live.com', '$2b$10$FBoa3GTj635PsmJgOP6ma.2.sUKMbkCvyYrWY.ML4L454.Cs67Ixy', 'Satyam Valley, Villa No 2, Rajeev Gandhi Nagar, Bachupally, Hyderabad', 'Hyderabad', 'Telangana', '500090', 17.5466727, 78.3937283, '2026-07-08 18:02:24.493439', '2026-09-15 07:28:46.92', 'individual', NULL),
	('79a4f427-bb1c-4296-b3d5-57f49cfb6979', '35329240-859e-4d67-a256-53eb2b96cd58', 'Sanjeev Nihal', '7799846684', 'sanjeevnihal.s@gmail.com', '$2b$10$TYY1XhJ7XTRTfkvfnl8w1ekLYCrJkDqTNApZfXJXyTPVaDOU9E1Oy', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-19 15:12:58.852617', '2026-07-19 16:49:41.999', 'business', NULL),
	('912e7fef-d2bc-4af6-9313-d78b6d475301', '35329240-859e-4d67-a256-53eb2b96cd58', 'PortalUser', '91tSWTA7bg', NULL, '$2b$10$H0WeNhCNqRXnt4MX3iYBNuFD97b9b8WiwbDI2uNTLilCg.cyxoGB6', NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-06 16:08:44.304', '2026-02-06 16:08:44.304', 'business', NULL),
	('9ea8e23b-c826-48be-8505-4bb091325f2f', '35329240-859e-4d67-a256-53eb2b96cd58', 'Test AI User', '9961317077', NULL, '$2b$10$vSrbJZ3C5HxLGB/bmoDP9umusqNae0AjSUQYharUyQvVxNuetwpJu', '123 Test Street', 'Mumbai', 'Maharashtra', '400001', NULL, NULL, '2026-02-13 10:28:09.811', '2026-02-13 10:28:09.811', 'business', NULL),
	('b66c47dd-e7ea-4183-bfb3-1e25e2bc6ff4', '35329240-859e-4d67-a256-53eb2b96cd58', 'sanjeev nihal', '9160711252', 'sanjeevnihal.s@gmail.com', '$2b$10$R/IA1BwjeAn.w1HJf9/a0.519bmaevuRmNmGfG81K0JZF8AbStYMi', 'Satyam Valley, Villa No2, Rajeev Gandhi Nagar', 'Hyderabad', 'Telangana', '500090', NULL, NULL, '2026-02-07 01:55:33.066', '2026-09-11 10:40:45.64', 'business', '5f0c0b32-cc2c-4eea-b4d9-872b4f34c5fb'),
	('cdee6b47-8860-4861-9f14-ddbcd52a5554', '35329240-859e-4d67-a256-53eb2b96cd58', 'Portal Test User M4LUPR', '9106134823', NULL, '$2b$10$SzLeGlwiEqqCwTnnCChsOOQR1xeteFbjQfi6/O56QpOw2v/fmZCpi', '123 Test Sender Address', 'Chennai', 'Tamil Nadu', '600001', NULL, NULL, '2026-02-06 15:57:06.538', '2026-02-06 15:57:06.538', 'business', NULL),
	('d7cd0c84-701f-4ae9-a73b-053071c212b0', '35329240-859e-4d67-a256-53eb2b96cd58', 'RegistrationTest', '90ZatHZoAi', NULL, '$2b$10$5Hyd5decim/B1qkXrcjMu.S8ur1WypH/0AzvI1p7jxlMnN3Iie4oW', NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-06 16:10:49.901', '2026-02-06 16:10:49.901', 'business', NULL),
	('e0625663-f0e6-4554-bbfe-0e3324be7961', '35329240-859e-4d67-a256-53eb2b96cd58', 'Kondapur Cloth House', '9887766554', 'clothhouse.b2b.verify@xgoo.test', '$2b$10$NZM0OfXmD1jxObyajdMAt.hU3bnsr8hTQHJwFGKgXllYKk47HoatO', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-11 09:01:12.134353', '2026-09-11 09:01:12.134353', 'business', NULL),
	('ff7c1ca0-99fa-4126-871d-0398a75cea5a', '35329240-859e-4d67-a256-53eb2b96cd58', 'Pro Verify Store', '9090901122', 'pro.verify.911@xgoo.test', '$2b$10$q/RfSitGZScL4688iH.cRenzVJsLCUx29rZZ2mxy1FNl7FK7g48Oy', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-11 10:11:51.078066', '2026-09-11 10:11:51.078066', 'business', NULL);

-- Dumping structure for table public.customers
CREATE TABLE IF NOT EXISTS "customers" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"phone" VARCHAR(20) NOT NULL,
	"email" VARCHAR(255) NULL DEFAULT NULL,
	"address" TEXT NULL DEFAULT NULL,
	"city" VARCHAR(100) NULL DEFAULT NULL,
	"state" VARCHAR(100) NULL DEFAULT NULL,
	"pincode" VARCHAR(10) NULL DEFAULT NULL,
	"gst_number" VARCHAR(20) NULL DEFAULT NULL,
	"customer_type" VARCHAR(20) NOT NULL DEFAULT 'walk_in',
	"payment_type" VARCHAR(20) NOT NULL DEFAULT 'prepaid',
	"credit_limit" NUMERIC(12,2) NULL DEFAULT '0',
	"credit_balance" NUMERIC(12,2) NULL DEFAULT '0',
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"is_demo" BOOLEAN NULL DEFAULT false,
	"service_opted" VARCHAR(50) NULL DEFAULT NULL,
	"lead_from" VARCHAR(50) NULL DEFAULT NULL,
	"service_request_method" VARCHAR(50) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "customers_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_customers_office" ON "" ("office_id");
CREATE INDEX "idx_customers_phone" ON "" ("phone");;

-- Dumping data for table public.customers: -1 rows
INSERT INTO "customers" ("id", "office_id", "name", "phone", "email", "address", "city", "state", "pincode", "gst_number", "customer_type", "payment_type", "credit_limit", "credit_balance", "created_at", "updated_at", "is_demo", "service_opted", "lead_from", "service_request_method") VALUES
	('00543eb9-6118-4d06-944d-628bb64a0667', '35329240-859e-4d67-a256-53eb2b96cd58', 'Priya Gupta', '9812345672', NULL, '789 Residential Colony', 'Delhi', 'Delhi', '110001', NULL, 'walk_in', 'prepaid', 0.00, 0.00, '2026-07-04 17:00:09.111794', '2026-07-04 17:00:09.111794', 'true', NULL, NULL, NULL),
	('5251b1ca-98f8-4a99-988e-1833002e8e86', '35329240-859e-4d67-a256-53eb2b96cd58', 'Sharma Electronics', '9812345670', 'sharma.electronics@example.com', '123 Market Street, Sector 15', 'Noida', 'Uttar Pradesh', '201301', '09AAAAA0000A1Z5', 'business', 'credit', 50000.00, 0.00, '2026-07-04 17:00:08.838442', '2026-07-04 17:00:08.838442', 'true', NULL, NULL, NULL),
	('54152642-6219-4aa6-8256-f104f9f20750', '35329240-859e-4d67-a256-53eb2b96cd58', 'Priya Gupta', '9812345672', NULL, '789 Residential Colony', 'Delhi', 'Delhi', '110001', NULL, 'walk_in', 'prepaid', 0.00, 0.00, '2026-02-05 01:47:53.648', '2026-02-05 01:47:53.648', 'false', NULL, NULL, NULL),
	('561c5ce7-6ed7-4a91-b15e-b8a86fb03a6b', '35329240-859e-4d67-a256-53eb2b96cd58', 'Tech Solutions Pvt Ltd', '9812345673', 'info@techsolutions.com', 'Tower A, IT Park', 'Bangalore', 'Karnataka', '560001', '29CCCCC0000C1Z5', 'business', 'credit', 200000.00, 0.00, '2026-02-05 01:47:53.651', '2026-02-05 01:47:53.651', 'false', NULL, NULL, NULL),
	('81408848-bdb2-44c5-a6fc-358cb8cb9feb', '35329240-859e-4d67-a256-53eb2b96cd58', 'Raj Enterprises', '9812345671', 'raj.enterprises@example.com', '456 Industrial Area, Phase 2', 'Gurgaon', 'Haryana', '122001', '06BBBBB0000B1Z5', 'business', 'credit', 100000.00, 0.00, '2026-07-04 17:00:08.975554', '2026-07-04 17:00:08.975554', 'true', NULL, NULL, NULL),
	('8858f683-612c-4738-a2a4-c6f9465fde43', '35329240-859e-4d67-a256-53eb2b96cd58', 'Raj Enterprises', '9812345671', 'raj.enterprises@example.com', '456 Industrial Area, Phase 2', 'Gurgaon', 'Haryana', '122001', '06BBBBB0000B1Z5', 'business', 'credit', 100000.00, 0.00, '2026-02-05 01:47:53.645', '2026-02-05 01:47:53.645', 'false', NULL, NULL, NULL),
	('a00db5b6-9273-411c-bf7a-2f1a88b31463', '35329240-859e-4d67-a256-53eb2b96cd58', 'Tech Solutions Pvt Ltd', '9812345673', 'info@techsolutions.com', 'Tower A, IT Park', 'Bangalore', 'Karnataka', '560001', '29CCCCC0000C1Z5', 'business', 'credit', 200000.00, 0.00, '2026-07-04 17:00:09.246604', '2026-07-04 17:00:09.246604', 'true', NULL, NULL, NULL),
	('f8694b3f-c536-45c8-991d-629a0ca8a848', '35329240-859e-4d67-a256-53eb2b96cd58', 'Sharma Electronics', '9812345670', 'sharma.electronics@example.com', '123 Market Street, Sector 15', 'Noida', 'Uttar Pradesh', '201301', '09AAAAA0000A1Z5', 'business', 'credit', 50000.00, 0.00, '2026-02-05 01:47:53.641', '2026-02-05 01:47:53.641', 'false', NULL, NULL, NULL);

-- Dumping structure for table public.invoices
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"shipment_id" VARCHAR NOT NULL,
	"invoice_number" VARCHAR(50) NOT NULL,
	"invoice_date" TIMESTAMP NULL DEFAULT now(),
	"subtotal" NUMERIC(12,2) NOT NULL,
	"gst_amount" NUMERIC(12,2) NULL DEFAULT '0',
	"total_amount" NUMERIC(12,2) NOT NULL,
	"pdf_url" VARCHAR(500) NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	CONSTRAINT "invoices_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_invoices_shipment" ON "" ("shipment_id");
CREATE INDEX "idx_invoices_number" ON "" ("invoice_number");;

-- Dumping data for table public.invoices: -1 rows
INSERT INTO "invoices" ("id", "shipment_id", "invoice_number", "invoice_date", "subtotal", "gst_amount", "total_amount", "pdf_url", "created_at") VALUES
	('09668106-9bb5-4e76-9bf8-ee7014320ff1', '495461be-03f1-461c-b84d-cd1db5ea97c2', 'INVMLB1GLOX', '2026-02-06 15:27:01.331', 295.00, 0.00, 295.00, NULL, '2026-02-06 15:27:01.331'),
	('14cb1bd6-54dc-4d28-9e28-5251981aec25', 'fd325b73-8b8a-4909-b6aa-c1969ed66864', 'INVMRDJKX9O', '2026-07-09 13:28:03.066041', 5000.00, 0.00, 5000.00, NULL, '2026-07-09 13:28:03.066041'),
	('89cd899f-e92c-4bc0-9eb8-1c41cf030141', '824ded62-f98b-4fef-864b-516a32d4f080', 'INVMR6MMCVX', '2026-07-04 17:18:45.38164', 57.50, 0.00, 57.50, NULL, '2026-07-04 17:18:45.38164'),
	('b8b12965-1dc8-4912-96bf-352b3333b984', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 'INVMSZQFCAQ', '2026-08-19 06:50:18.057135', 0.00, 0.00, 0.00, NULL, '2026-08-19 06:50:18.057135'),
	('df7cb03e-9cb2-4b27-a899-e5901f8a1e0b', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 'INVMRADIUIS', '2026-07-07 08:15:09.727322', 1682.50, 0.00, 1682.50, NULL, '2026-07-07 08:15:09.727322');

-- Dumping structure for table public.messages
CREATE TABLE IF NOT EXISTS "messages" (
	"id" SERIAL NOT NULL,
	"conversation_id" INTEGER NOT NULL,
	"role" TEXT NOT NULL,
	"content" TEXT NOT NULL,
	"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("id"),
	CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);

-- Dumping data for table public.messages: -1 rows

-- Dumping structure for table public.office_members
CREATE TABLE IF NOT EXISTS "office_members" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"user_id" VARCHAR NOT NULL,
	"email" VARCHAR(255) NOT NULL,
	"display_name" VARCHAR(255) NULL DEFAULT NULL,
	"role" VARCHAR(30) NOT NULL DEFAULT 'staff',
	"status" VARCHAR(20) NOT NULL DEFAULT 'active',
	"branch_id" VARCHAR NULL DEFAULT NULL,
	"invited_by_user_id" VARCHAR NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	UNIQUE ("user_id"),
	UNIQUE ("email"),
	CONSTRAINT "office_members_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
	CONSTRAINT "office_members_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_office_members_office" ON "" ("office_id");
CREATE INDEX "idx_office_members_branch" ON "" ("branch_id");;

-- Dumping data for table public.office_members: -1 rows
INSERT INTO "office_members" ("id", "office_id", "user_id", "email", "display_name", "role", "status", "branch_id", "invited_by_user_id", "created_at", "updated_at") VALUES
	('54a74143-9bbd-497b-9ed3-e1216ad53746', '35329240-859e-4d67-a256-53eb2b96cd58', '203ef505-318f-4d11-a2b6-931a5f022980', 'xgoo.express@gmail.com', 'XGoo Command Super Admin', 'super_admin', 'active', NULL, '203ef505-318f-4d11-a2b6-931a5f022980', '2026-08-23 13:48:41.268718', '2026-09-28 12:40:53.886'),
	('648fc6ed-425e-44b6-8776-9eabdcd968d3', 'f28118f8-c1c9-46e0-a415-8c6c5e03a9fe', '31c4f113-c552-4571-8544-057265db1415', 'xgoo.dev@gmail.com', 'XGoo Admin', 'owner', 'active', NULL, NULL, '2026-08-23 09:32:15.713791', '2026-08-23 09:47:14.909'),
	('f67c1c85-fbee-4d28-adcd-0b7fdd1b7a47', '35329240-859e-4d67-a256-53eb2b96cd58', '5f0c0b32-cc2c-4eea-b4d9-872b4f34c5fb', 'sanjeevnihal.s@gmail.com', 'Sanjeev', 'staff', 'active', NULL, '203ef505-318f-4d11-a2b6-931a5f022980', '2026-09-12 18:45:15.97157', '2026-09-12 18:45:15.97157');

-- Dumping structure for table public.offices
CREATE TABLE IF NOT EXISTS "offices" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"user_id" VARCHAR NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"address" TEXT NULL DEFAULT NULL,
	"city" VARCHAR(100) NULL DEFAULT NULL,
	"state" VARCHAR(100) NULL DEFAULT NULL,
	"pincode" VARCHAR(10) NULL DEFAULT NULL,
	"phone" VARCHAR(20) NULL DEFAULT NULL,
	"email" VARCHAR(255) NULL DEFAULT NULL,
	"gst_number" VARCHAR(20) NULL DEFAULT NULL,
	"logo_url" VARCHAR(500) NULL DEFAULT NULL,
	"public_slug" VARCHAR(50) NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"document_settings" JSONB NULL DEFAULT NULL,
	"whatsapp_settings" JSONB NULL DEFAULT NULL,
	"pickup_settings" JSONB NULL DEFAULT NULL,
	"app_banner_settings" JSONB NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("user_id"),
	UNIQUE ("public_slug")
)
CREATE INDEX "idx_offices_slug" ON "" ("public_slug");;

-- Dumping data for table public.offices: 7 rows
INSERT INTO "offices" ("id", "user_id", "name", "address", "city", "state", "pincode", "phone", "email", "gst_number", "logo_url", "public_slug", "created_at", "updated_at", "document_settings", "whatsapp_settings", "pickup_settings", "app_banner_settings") VALUES
	('0f808bf9-0aa0-4a53-8833-5362a67e2596', '33edf09b-5897-4ef4-952e-27bceea3a702', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'my-courier-office-5', '2026-07-04 16:59:15.415078', '2026-07-04 16:59:15.415078', NULL, NULL, NULL, NULL),
	('35329240-859e-4d67-a256-53eb2b96cd58', '203ef505-318f-4d11-a2b6-931a5f022980', 'XGoo Kondapur', '', '', '', '', '', '', '', NULL, 'demo-office', '2026-02-05 01:47:53.624', '2026-09-28 12:44:13.721', NULL, '{"wabaId": "1649462646116769", "enabled": true, "templates": [{"id": "1107048418517885", "name": "xgoo_customer_app_otp", "status": "APPROVED", "buttons": [{"text": "Copy code", "type": "URL", "index": 0, "urlPattern": "https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code_expiration_minutes=5&code=otp{{1}}", "urlParamCount": 1}], "category": "AUTHENTICATION", "language": "en_US", "headerFormat": "TEXT", "bodyParamCount": 3, "bodyParamNames": [], "parameterFormat": "positional", "buttonParamCount": 1, "buttonParamIndex": 0, "headerParamCount": 0, "headerParamNames": [], "bodyParamExamples": ["12345", "Login", "1800-555-1234"], "buttonParamExamples": ["https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code_expiration_minutes=5&code=otp123456"], "headerMediaRequired": false, "headerParamExamples": [], "headerMediaExampleUrl": ""}, {"id": "2184070879117013", "name": "xgoo_thankyou_v1", "status": "APPROVED", "buttons": [{"text": "Write your feedback", "type": "URL", "index": 0, "urlPattern": "https://www.xgoo.in/", "urlParamCount": 0}], "category": "UTILITY", "language": "en", "headerFormat": "IMAGE", "bodyParamCount": 1, "bodyParamNames": [], "parameterFormat": "positional", "buttonParamCount": 0, "buttonParamIndex": 0, "headerParamCount": 0, "headerParamNames": [], "bodyParamExamples": ["Customer Name"], "buttonParamExamples": [], "headerMediaRequired": true, "headerParamExamples": [], "headerMediaExampleUrl": "https://scontent.whatsapp.net/v/t61.29466-34/656639129_2184070882450346_5242036296068688342_n.png?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=aVpvDZBaNCEQ7kNvwEi0CmP&_nc_oc=AdqfUsyF1dXQUGBVgKHtmxkb-8oy02ncPzjZjRAHR3Nd4m0xj85RVxmSyL7bo3EfPXsIhfDLhYk8RVy4kC0e8Y-0&_nc_zt=3&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=ZxVOeFyBFR5HEuudZermAw&_nc_tpa=Q5bMBQLGirAqNdHsMs7jt50Q96fUqPyO9PQHNp-MlVaTUFRiVGjmnCybivepwS60CpzcL3Ty5HBaUmrGIg&oh=01_Q5Aa5gGX-whVNKcc3_rzKvhs0dneBXt0T-umhX2oBAvzswlFVQ&oe=6ACB11C8"}, {"id": "1577163130507982", "name": "xgoo_invoice_v1", "status": "APPROVED", "buttons": [{"text": "Track your parcel", "type": "URL", "index": 0, "urlPattern": "https://www.xgoo.in/", "urlParamCount": 0}], "category": "UTILITY", "language": "en", "headerFormat": "DOCUMENT", "bodyParamCount": 3, "bodyParamNames": [], "parameterFormat": "positional", "buttonParamCount": 0, "buttonParamIndex": 0, "headerParamCount": 0, "headerParamNames": [], "bodyParamExamples": ["Customer Name", "XG1234567", "9000"], "buttonParamExamples": [], "headerMediaRequired": true, "headerParamExamples": [], "headerMediaExampleUrl": "https://scontent.whatsapp.net/v/t61.29466-34/656740417_1577163133841315_8368975386908904315_n.pdf?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=Muyd27Qi5p8Q7kNvwE-9MF-&_nc_oc=AdoW294oGG_O4Y8p040vDNTx49hgLSlV-eI5OSveajNRbT7Z09NfR_DauAM2bZOI6xFNpY9oFWNZ_P5i9rawmdzg&_nc_zt=3&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=ZxVOeFyBFR5HEuudZermAw&_nc_tpa=Q5bMBQKYTUgd0BjicIn8oid6DaX41rJ-qoEhlWBESNnlTZ8f5UoF0GtDRK7fXtCptLW0EuIRKvK1HTlxig&oh=01_Q5Aa5gF_MvwzswiEqxEY77uIoL3lte4v7gLwJ_xp4p7tYl10Bg&oe=6ACB2548"}, {"id": "1823043328666128", "name": "xgoo_tracking_v1", "status": "APPROVED", "buttons": [{"text": "Track your parcel", "type": "URL", "index": 0, "urlPattern": "https://www.xgoo.in/", "urlParamCount": 0}], "category": "UTILITY", "language": "en", "headerFormat": "TEXT", "bodyParamCount": 2, "bodyParamNames": [], "parameterFormat": "positional", "buttonParamCount": 0, "buttonParamIndex": 0, "headerParamCount": 0, "headerParamNames": [], "bodyParamExamples": ["Customer Name", "XG000000000012345"], "buttonParamExamples": [], "headerMediaRequired": false, "headerParamExamples": [], "headerMediaExampleUrl": ""}, {"id": "864636533037240", "name": "xgoo_booking_success_v1", "status": "APPROVED", "buttons": [], "category": "UTILITY", "language": "en", "headerFormat": "TEXT", "bodyParamCount": 3, "bodyParamNames": [], "parameterFormat": "positional", "buttonParamCount": 0, "buttonParamIndex": 0, "headerParamCount": 0, "headerParamNames": [], "bodyParamExamples": ["Customer Name", "XG0000123", "16 April 2026"], "buttonParamExamples": [], "headerMediaRequired": false, "headerParamExamples": [], "headerMediaExampleUrl": ""}, {"id": "1316563887131278", "name": "xgoo_offer_update_v1", "status": "APPROVED", "buttons": [{"text": "Book your parcel now", "type": "URL", "index": 0, "urlPattern": "https://www.xgoo.in/book", "urlParamCount": 0}, {"text": "Talk to XGoo Team", "type": "PHONE_NUMBER", "index": 1, "urlParamCount": 0}], "category": "MARKETING", "language": "en", "headerFormat": "IMAGE", "bodyParamCount": 2, "bodyParamNames": [], "parameterFormat": "positional", "buttonParamCount": 0, "buttonParamIndex": 0, "headerParamCount": 0, "headerParamNames": [], "bodyParamExamples": ["Customer Name", "Ganesh Chathurthi Offer - 50% off on all the International Courier Services."], "buttonParamExamples": [], "headerMediaRequired": true, "headerParamExamples": [], "headerMediaExampleUrl": "https://scontent.whatsapp.net/v/t61.29466-34/660845326_1316563893797944_7084766631265749766_n.png?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=jk7iq5sY6ToQ7kNvwHAN60e&_nc_oc=Adoiy5hj3VenX4JQZwdyLSFmMYebAk0T9hPu5cepu-XwMstzcwLbtNF6VFXY5LQSbCXg9W06CWh9HF9w4VrcoJIS&_nc_zt=3&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=ZxVOeFyBFR5HEuudZermAw&_nc_tpa=Q5bMBQJW0LALmtq9fhVAUew_gzP2_HAGDy3JVM7HzsQT1Gddr43FxGaqbpYweLXIItYk0zrpEqjYiKAhnA&oh=01_Q5Aa5gGct_78V_g_k0HYtNHE-HOfnOfB4P2Q6MyPwrUcdEBTnA&oe=6ACB2737"}, {"id": "1005837508865524", "name": "welcome_message", "status": "APPROVED", "buttons": [{"text": "Book a Parcel", "type": "URL", "index": 0, "urlPattern": "https://www.xgoo.in/book", "urlParamCount": 0}, {"text": "Talk to XGoo Team", "type": "PHONE_NUMBER", "index": 1, "urlParamCount": 0}, {"text": "Track Shipment", "type": "QUICK_REPLY", "index": 2, "urlParamCount": 0}], "category": "MARKETING", "language": "en", "headerFormat": "IMAGE", "bodyParamCount": 1, "bodyParamNames": [], "parameterFormat": "positional", "buttonParamCount": 0, "buttonParamIndex": 0, "headerParamCount": 0, "headerParamNames": [], "bodyParamExamples": ["Customer Name"], "buttonParamExamples": [], "headerMediaRequired": true, "headerParamExamples": [], "headerMediaExampleUrl": "https://scontent.whatsapp.net/v/t61.29466-34/534424483_1005837512198857_6745119227775431519_n.png?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=msWmc4n_Q48Q7kNvwEQz8BX&_nc_oc=AdorVPYOXnBlgMKnRE7E_Hd9ddvCnBLvhj-3x_ygPHVB68EBZhfL67tjkE_Vu-iGM0juhWqNeBcrzdPNeaezWf7b&_nc_zt=3&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=ZxVOeFyBFR5HEuudZermAw&_nc_tpa=Q5bMBQLa-dTktrXuhjfSYR4GLRv6GcDDZ7eQspnB5RIpAriGDGZGsNkycB3vlOmCYZj9gjGzpII57ddhbQ&oh=01_Q5Aa5gH0IrG5dZEQCKCIB4_LATqTto2yKYw29mMKWlzun6_-CQ&oe=6ACB0197"}], "apiVersion": "v21.0", "automation": {"offers": {"enabled": false, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}, "invoice": {"enabled": false, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}, "welcome": {"enabled": true, "languageCode": "en", "templateName": "welcome_message", "replyOnInboundGreeting": true}, "pre_book": {"enabled": false, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}, "tracking": {"enabled": false, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}, "thank_you": {"enabled": false, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}, "customer_otp": {"enabled": true, "languageCode": "en_US", "templateName": "xgoo_customer_app_otp", "replyOnInboundGreeting": true}, "post_booking": {"enabled": false, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}, "receiver_ack": {"enabled": true, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}, "booking_request": {"enabled": false, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}, "booking_success": {"enabled": false, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}, "shipment_status": {"enabled": false, "languageCode": "en", "templateName": "", "replyOnInboundGreeting": true}}, "accessToken": "EAAXgvlHhDZCgBSSVLUyXdvF4sxkktDoN1fpINbn0YjzhrirYGJ0FUio3JcZAWP1pZBFKktkLYm005gVRh8wG5MfZBCZAPfWoIg42FTpvZA8I9vEYtom0F1iyzw3xeaxBXUioH2cTlsq0oGXOnx3f5ZAweTjymeKal6SzuhHg9u0NowzcCrgqNn3ymqOzVp4RQZDZD", "lastSyncedAt": "2026-09-11T07:17:13.504Z", "phoneNumberId": "1166888373180816", "publicAppBaseUrl": "https://www.xgoo.in/assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961-BGOeQ-59.png", "webhookVerifyToken": "Aqzpn7799@q", "defaultHeaderMediaUrl": "https://www.xgoo.in/assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961-BGOeQ-59.png", "welcomeTemplateConfig": {"supportPhone": "9347138235", "bookParcelUrl": "https://www.xgoo.in/book", "trackShipmentSuffix": "https://www.xgoo.in/book"}, "businessWhatsAppNumber": "", "defaultHeaderMediaPath": "/objects/4bafa9ef-0ccf-439f-afc5-dad85ac1ab47.png"}', NULL, NULL),
	('3a6731b5-f20e-4608-8e4d-71b7aa69ebd3', '5f0c0b32-cc2c-4eea-b4d9-872b4f34c5fb', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'my-courier-office-3', '2026-05-16 18:18:06.499874', '2026-05-16 18:18:06.499874', NULL, NULL, NULL, NULL),
	('409deea0-9e78-4393-979b-753fc582e907', '7d60e342-8267-4fe3-b264-4a434ac1d946', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'my-courier-office-1', '2026-04-14 19:21:05.749406', '2026-04-14 19:21:05.749406', NULL, NULL, NULL, NULL),
	('a95b268a-da9d-4161-b68a-7b9bf9e14a3f', '11a6db1f-d872-44eb-84cc-7d943a11d996', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'my-courier-office-4', '2026-05-21 16:43:07.065312', '2026-05-21 16:43:07.065312', NULL, NULL, NULL, NULL),
	('d5cd99a0-5e61-4b8f-818e-7cee4855ec89', '31c4f113-c552-4571-8544-057265db1415', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'my-courier-office-2', '2026-04-23 11:34:15.194497', '2026-04-23 11:34:15.194497', NULL, NULL, NULL, NULL),
	('f28118f8-c1c9-46e0-a415-8c6c5e03a9fe', '42784958-4d5c-4ab4-9350-40cae36665ba', 'My Courier Office', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'my-courier-office', '2026-04-04 06:22:31.470249', '2026-04-04 06:22:31.470249', NULL, NULL, NULL, NULL);

-- Dumping structure for table public.payments
CREATE TABLE IF NOT EXISTS "payments" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"shipment_id" VARCHAR NULL DEFAULT NULL,
	"amount" NUMERIC(12,2) NOT NULL,
	"payment_mode" VARCHAR(30) NOT NULL,
	"payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
	"transaction_reference" VARCHAR(100) NULL DEFAULT NULL,
	"notes" TEXT NULL DEFAULT NULL,
	"paid_at" TIMESTAMP NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"settlement_id" VARCHAR NULL DEFAULT NULL,
	"quotation_id" VARCHAR NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "payments_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_payments_shipment" ON "" ("shipment_id");
CREATE INDEX "idx_payments_status" ON "" ("payment_status");
CREATE INDEX "idx_payments_quotation" ON "" ("quotation_id");;

-- Dumping data for table public.payments: 4 rows
INSERT INTO "payments" ("id", "shipment_id", "amount", "payment_mode", "payment_status", "transaction_reference", "notes", "paid_at", "created_at", "settlement_id", "quotation_id") VALUES
	('487a626f-168f-402e-b8e7-b00391c308ff', 'fd325b73-8b8a-4909-b6aa-c1969ed66864', 5000.00, 'cash', 'completed', NULL, NULL, '2026-07-09 13:28:01.574', '2026-07-09 13:28:02.226936', NULL, NULL),
	('4b629302-3408-4395-8c5c-887b495ea86f', '1b148447-cf37-40a1-9fa2-99a7eec3f0a6', 0.00, 'cash', 'completed', NULL, 'Dummy World First booking test', '2026-08-18 20:04:37.815', '2026-08-18 20:04:38.325391', NULL, NULL),
	('8226ac6d-9c13-45c4-bfaa-09a94417253b', '495461be-03f1-461c-b84d-cd1db5ea97c2', 295.00, 'upi', 'completed', NULL, NULL, '2026-02-06 15:22:12.81', '2026-02-06 15:22:12.811', NULL, NULL),
	('e1cdec4e-6c02-4e38-b85f-5d42814489e5', '1d9a915d-e3f3-42bb-b023-010fc31065f3', 1682.50, 'cash', 'completed', NULL, NULL, '2026-07-07 08:15:08.433', '2026-07-07 08:15:08.844775', NULL, NULL);

-- Dumping structure for table public.pickup_jobs
CREATE TABLE IF NOT EXISTS "pickup_jobs" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"branch_id" VARCHAR NULL DEFAULT NULL,
	"booking_request_id" VARCHAR NOT NULL,
	"partner_id" VARCHAR NULL DEFAULT NULL,
	"quotation_id" VARCHAR NULL DEFAULT NULL,
	"shipment_id" VARCHAR NULL DEFAULT NULL,
	"status" VARCHAR(30) NOT NULL DEFAULT 'unassigned',
	"actual_weight" NUMERIC(10,2) NULL DEFAULT NULL,
	"actual_pieces" INTEGER NULL DEFAULT NULL,
	"actual_contents" TEXT NULL DEFAULT NULL,
	"inspection_notes" TEXT NULL DEFAULT NULL,
	"inspection_photo_urls" UNKNOWN NULL DEFAULT NULL,
	"awb_number" VARCHAR(100) NULL DEFAULT NULL,
	"assigned_at" TIMESTAMP NULL DEFAULT NULL,
	"accepted_at" TIMESTAMP NULL DEFAULT NULL,
	"en_route_at" TIMESTAMP NULL DEFAULT NULL,
	"arrived_at" TIMESTAMP NULL DEFAULT NULL,
	"inspected_at" TIMESTAMP NULL DEFAULT NULL,
	"quote_sent_at" TIMESTAMP NULL DEFAULT NULL,
	"quote_accepted_at" TIMESTAMP NULL DEFAULT NULL,
	"packed_at" TIMESTAMP NULL DEFAULT NULL,
	"awb_created_at" TIMESTAMP NULL DEFAULT NULL,
	"completed_at" TIMESTAMP NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	CONSTRAINT "pickup_jobs_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT "pickup_jobs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
	CONSTRAINT "pickup_jobs_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT "pickup_jobs_partner_id_pickup_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "pickup_partners" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
	CONSTRAINT "pickup_jobs_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
)
CREATE INDEX "idx_pickup_jobs_office" ON "" ("office_id");
CREATE INDEX "idx_pickup_jobs_partner" ON "" ("partner_id");
CREATE INDEX "idx_pickup_jobs_booking_request" ON "" ("booking_request_id");
CREATE INDEX "idx_pickup_jobs_status" ON "" ("status");;

-- Dumping data for table public.pickup_jobs: -1 rows
INSERT INTO "pickup_jobs" ("id", "office_id", "branch_id", "booking_request_id", "partner_id", "quotation_id", "shipment_id", "status", "actual_weight", "actual_pieces", "actual_contents", "inspection_notes", "inspection_photo_urls", "awb_number", "assigned_at", "accepted_at", "en_route_at", "arrived_at", "inspected_at", "quote_sent_at", "quote_accepted_at", "packed_at", "awb_created_at", "completed_at", "created_at", "updated_at") VALUES
	('16eb73d8-03da-4020-bcf1-a5a93d00bc89', '35329240-859e-4d67-a256-53eb2b96cd58', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', '778c471d-b000-4622-b1d8-6e15b91a7729', 'cdafe0bf-965a-4bc7-9eb7-d207bf3c70d8', '20768be7-b422-44a9-b8ff-9a6324afa6d3', NULL, 'quote_sent', 2.00, 1, 'Clothes', NULL, '{}', NULL, '2026-09-12 19:21:14.836', '2026-09-12 19:24:16.699', '2026-09-12 19:24:34.447', '2026-09-12 19:24:39.607', '2026-09-12 19:25:15.818', '2026-09-12 19:25:44.215', NULL, NULL, NULL, NULL, '2026-09-12 19:21:15.113456', '2026-09-12 19:25:44.215');

-- Dumping structure for table public.pickup_partner_push_tokens
CREATE TABLE IF NOT EXISTS "pickup_partner_push_tokens" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"partner_id" VARCHAR NOT NULL,
	"token" VARCHAR(255) NOT NULL,
	"platform" VARCHAR(20) NOT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	UNIQUE ("token"),
	CONSTRAINT "pickup_partner_push_tokens_partner_id_pickup_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "pickup_partners" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_pickup_partner_push_tokens_partner" ON "" ("partner_id");;

-- Dumping data for table public.pickup_partner_push_tokens: -1 rows

-- Dumping structure for table public.pickup_partner_sessions
CREATE TABLE IF NOT EXISTS "pickup_partner_sessions" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"partner_id" VARCHAR NOT NULL,
	"token" VARCHAR(255) NOT NULL,
	"expires_at" TIMESTAMP NOT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	UNIQUE ("token"),
	CONSTRAINT "pickup_partner_sessions_partner_id_pickup_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "pickup_partners" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_pickup_partner_sessions_token" ON "" ("token");
CREATE INDEX "idx_pickup_partner_sessions_partner" ON "" ("partner_id");;

-- Dumping data for table public.pickup_partner_sessions: -1 rows
INSERT INTO "pickup_partner_sessions" ("id", "partner_id", "token", "expires_at", "created_at") VALUES
	('142649bd-552e-496d-9476-a38360997568', 'cdafe0bf-965a-4bc7-9eb7-d207bf3c70d8', '8ffd7d10-ec6b-41e7-a07e-fbfd0ff96ba4', '2026-10-12 19:12:06.073', '2026-09-12 19:12:06.744665');

-- Dumping structure for table public.pickup_partners
CREATE TABLE IF NOT EXISTS "pickup_partners" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"branch_id" VARCHAR NULL DEFAULT NULL,
	"name" VARCHAR(255) NOT NULL,
	"phone" VARCHAR(20) NOT NULL,
	"status" VARCHAR(20) NOT NULL DEFAULT 'active',
	"availability" VARCHAR(20) NOT NULL DEFAULT 'offline',
	"last_assigned_at" TIMESTAMP NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"password_hash" VARCHAR(255) NULL DEFAULT NULL,
	"address" TEXT NULL DEFAULT NULL,
	"govt_id_type" VARCHAR(40) NULL DEFAULT NULL,
	"govt_id_number" VARCHAR(80) NULL DEFAULT NULL,
	"govt_id_document_url" TEXT NULL DEFAULT NULL,
	"signup_source" VARCHAR(20) NOT NULL DEFAULT 'hub',
	PRIMARY KEY ("id"),
	UNIQUE ("office_id", "phone"),
	CONSTRAINT "pickup_partners_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
	CONSTRAINT "pickup_partners_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_pickup_partners_office" ON "" ("office_id");
CREATE INDEX "idx_pickup_partners_branch" ON "" ("branch_id");
CREATE INDEX "idx_pickup_partners_availability" ON "" ("office_id", "status", "availability");;

-- Dumping data for table public.pickup_partners: -1 rows
INSERT INTO "pickup_partners" ("id", "office_id", "branch_id", "name", "phone", "status", "availability", "last_assigned_at", "created_at", "updated_at", "password_hash", "address", "govt_id_type", "govt_id_number", "govt_id_document_url", "signup_source") VALUES
	('cdafe0bf-965a-4bc7-9eb7-d207bf3c70d8', '35329240-859e-4d67-a256-53eb2b96cd58', '64e22e3f-6663-4ba5-a56d-abfd0c6802fc', 'Nihal', '7799846684', 'active', 'busy', '2026-09-12 19:21:14.836', '2026-09-12 18:50:50.204466', '2026-09-12 19:21:14.977', '$2b$10$VqzgLp4tCYD2p7UTv3qA0..jJuOzRnYSg9FeUYjSU9avMJg6tv1RK', NULL, NULL, NULL, NULL, 'hub');

-- Dumping structure for table public.quotations
CREATE TABLE IF NOT EXISTS "quotations" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"quotation_number" VARCHAR(50) NOT NULL,
	"customer_name" VARCHAR(255) NOT NULL,
	"customer_phone" VARCHAR(20) NULL DEFAULT NULL,
	"customer_email" VARCHAR(255) NULL DEFAULT NULL,
	"sender_city" VARCHAR(100) NULL DEFAULT NULL,
	"sender_state" VARCHAR(100) NULL DEFAULT NULL,
	"sender_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"receiver_city" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_state" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"weight" NUMERIC(10,2) NOT NULL,
	"number_of_pieces" INTEGER NULL DEFAULT 1,
	"content_description" TEXT NULL DEFAULT NULL,
	"declared_value" NUMERIC(12,2) NULL DEFAULT NULL,
	"service_type" VARCHAR(20) NOT NULL DEFAULT 'surface',
	"courier_partner_id" VARCHAR NULL DEFAULT NULL,
	"base_amount" NUMERIC(12,2) NOT NULL DEFAULT '0',
	"additional_charges" NUMERIC(12,2) NULL DEFAULT '0',
	"gst_amount" NUMERIC(12,2) NULL DEFAULT '0',
	"total_amount" NUMERIC(12,2) NOT NULL DEFAULT '0',
	"status" VARCHAR(20) NOT NULL DEFAULT 'draft',
	"valid_until" TIMESTAMP NULL DEFAULT NULL,
	"notes" TEXT NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"is_demo" BOOLEAN NULL DEFAULT false,
	"booking_request_id" VARCHAR NULL DEFAULT NULL,
	"pickup_job_id" VARCHAR NULL DEFAULT NULL,
	"accept_token" VARCHAR(255) NULL DEFAULT NULL,
	"accepted_at" TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("accept_token"),
	CONSTRAINT "quotations_courier_partner_id_courier_partners_id_fk" FOREIGN KEY ("courier_partner_id") REFERENCES "courier_partners" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "quotations_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_quotations_office" ON "" ("office_id");
CREATE INDEX "idx_quotations_number" ON "" ("quotation_number");
CREATE INDEX "idx_quotations_status" ON "" ("status");
CREATE INDEX "idx_quotations_booking_request" ON "" ("booking_request_id");
CREATE INDEX "idx_quotations_pickup_job" ON "" ("pickup_job_id");;

-- Dumping data for table public.quotations: 4 rows
INSERT INTO "quotations" ("id", "office_id", "quotation_number", "customer_name", "customer_phone", "customer_email", "sender_city", "sender_state", "sender_pincode", "receiver_city", "receiver_state", "receiver_pincode", "weight", "number_of_pieces", "content_description", "declared_value", "service_type", "courier_partner_id", "base_amount", "additional_charges", "gst_amount", "total_amount", "status", "valid_until", "notes", "created_at", "updated_at", "is_demo", "booking_request_id", "pickup_job_id", "accept_token", "accepted_at") VALUES
	('20768be7-b422-44a9-b8ff-9a6324afa6d3', '35329240-859e-4d67-a256-53eb2b96cd58', 'QTMTYRZAIAGC', 'Kondapur Cloth House', '9887766554', 'clothhouse.b2b.verify@xgoo.test', 'Hyderabad', NULL, NULL, 'Hyderabad', NULL, NULL, 2.00, 1, 'Clothes', NULL, 'surface', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 0.00, 0.00, 0.00, 520.00, 'sent', NULL, NULL, '2026-09-12 19:25:44.726987', '2026-09-12 19:25:44.726987', 'false', '778c471d-b000-4622-b1d8-6e15b91a7729', '16eb73d8-03da-4020-bcf1-a5a93d00bc89', '32657783-a00f-4ce3-81ef-c86343480410', NULL),
	('402426ed-fdee-488e-85de-8c7461ca327e', '35329240-859e-4d67-a256-53eb2b96cd58', 'QTMR6LYGF8TI', 'Sample Exporter', '9876500002', NULL, 'Mumbai', 'Maharashtra', '400001', 'Dubai', 'UAE', '00000', 15.00, 1, 'Documents', NULL, 'air', 'b9597207-11c3-4e80-a0e7-896f3a8e8353', 3200.00, 0.00, 0.00, 3200.00, 'draft', NULL, NULL, '2026-07-04 17:00:10.214778', '2026-07-04 17:00:10.214778', 'true', NULL, NULL, NULL, NULL),
	('9c7f2858-d938-4378-ac68-9e877085d6cd', '35329240-859e-4d67-a256-53eb2b96cd58', 'QTMR6LYGBC2R', 'Demo Retail Store', '9876500001', 'demo.retail@example.com', 'Hyderabad', 'Telangana', '500001', 'Chennai', 'Tamil Nadu', '600001', 8.00, 2, 'Electronics sample', NULL, 'surface', '5026ddb3-bc3f-4817-9c02-33a141bb56e9', 450.00, 0.00, 0.00, 450.00, 'sent', NULL, NULL, '2026-07-04 17:00:10.073394', '2026-07-04 17:00:10.073394', 'true', NULL, NULL, NULL, NULL),
	('af7d2169-e092-4687-a082-28c3d307b6fc', '35329240-859e-4d67-a256-53eb2b96cd58', 'QTMLB1MN4PH3', 'Sanjeev Nihal', NULL, 'sanjeevnihal.s@gmail.com', 'Bangalore', 'Karnataka', '562163', 'Bangalore', 'Karnataka', '562163', 10.00, 12, 'Electronics ', 10000.00, 'surface', '8686cc80-9bea-45b1-9ce2-dc32d86cc6d7', 15000.00, 500.00, 18.00, 16500.00, 'accepted', '2026-02-28 00:00:00', 'None', '2026-02-06 15:31:43.13', '2026-02-06 15:31:43.13', 'false', NULL, NULL, NULL, NULL),
	('f034d8f5-07e2-4ad1-b97c-841afa2810a8', 'f28118f8-c1c9-46e0-a415-8c6c5e03a9fe', 'QTMNK49YE7VT', 'Sanjeev', '7799846684', 'sanjeevnihal@live.com', 'Hyderabad', 'Telangana', '500090', 'Bangalore', 'Karnataka', '560102', 15.00, 1, 'Food Items', 5000.00, 'surface', 'e7bb59b5-c689-4472-ba3f-eb6d705e076c', 1500.00, 0.00, 18.00, 1800.00, 'draft', '2026-04-05 00:00:00', 'None', '2026-04-04 09:15:10.374817', '2026-04-04 09:15:10.374817', 'false', NULL, NULL, NULL, NULL);

-- Dumping structure for table public.sessions
CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" VARCHAR NOT NULL,
	"sess" JSONB NOT NULL,
	"expire" TIMESTAMP NOT NULL,
	PRIMARY KEY ("sid")
)
CREATE INDEX "IDX_session_expire" ON "" ("expire");;

-- Dumping data for table public.sessions: 1 rows
INSERT INTO "sessions" ("sid", "sess", "expire") VALUES
	('HFMGz_CzubkhEjO8bvFVvOIj6E6VV85q', '{"cookie": {"path": "/", "secure": true, "expires": "2026-02-22T19:12:52.063Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "0b4f04f6-5cb5-43b8-b3a1-5765f8ebd426", "exp": 1771186371, "iat": 1771182771, "iss": "https://test-mock-oidc.replit.app/", "jti": "74034c8f7f5690c7a1ce44b89989bf1f", "sub": "41820828", "email": "user@example.com", "auth_time": 1771182771, "last_name": "User", "first_name": "Real"}, "expires_at": 1771186371, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzcxMTgyNzcxLCJleHAiOjE3NzExODYzNzEsInN1YiI6IjQxODIwODI4IiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IlJlYWwiLCJsYXN0X25hbWUiOiJVc2VyIn0.ffhtAwpPXK7OvtHPRo1q9JUPAa-sB25TTmnJNAIprQz8HeKHigjlv_fYtTvpmh6Rucg23KlX9M__HwuTPQmrHDM-VSX0G-9cra_v_9-xkfXlbKk79MrHGpMR951A2fisiPY3M2FwC6OVMnWa1SernsMzfGwZC__0bdCLqO6CNwzl8bevPp-PQ0Ifuz1z6iV3uiRoijPFkeIq5WeYKaIFZrSjO4aF4bu3XG4wPOaG4nsft-2X8NOkAvN7slLnLAxm3PPGKk7TFT1HTcnJ5hhkFWGVn72p2PEyiv_3boApbsVVBW-QPhNaa0YDUtrEnzrWd6cMURQbWpbXCU7I1Ytucw", "refresh_token": "eyJzdWIiOiI0MTgyMDgyOCIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJSZWFsIiwibGFzdF9uYW1lIjoiVXNlciJ9"}}}', '2026-02-22 19:14:05');

-- Dumping structure for table public.shipments
CREATE TABLE IF NOT EXISTS "shipments" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"customer_id" VARCHAR NULL DEFAULT NULL,
	"courier_partner_id" VARCHAR NULL DEFAULT NULL,
	"booking_number" VARCHAR(50) NOT NULL,
	"awb_number" VARCHAR(100) NULL DEFAULT NULL,
	"sender_name" VARCHAR(255) NOT NULL,
	"sender_phone" VARCHAR(20) NOT NULL,
	"sender_address" TEXT NOT NULL,
	"sender_city" VARCHAR(100) NULL DEFAULT NULL,
	"sender_state" VARCHAR(100) NULL DEFAULT NULL,
	"sender_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"receiver_name" VARCHAR(255) NOT NULL,
	"receiver_phone" VARCHAR(20) NOT NULL,
	"receiver_address" TEXT NOT NULL,
	"receiver_city" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_state" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"weight" NUMERIC(10,2) NOT NULL,
	"length" NUMERIC(10,2) NULL DEFAULT NULL,
	"width" NUMERIC(10,2) NULL DEFAULT NULL,
	"height" NUMERIC(10,2) NULL DEFAULT NULL,
	"volumetric_weight" NUMERIC(10,2) NULL DEFAULT NULL,
	"chargeable_weight" NUMERIC(10,2) NULL DEFAULT NULL,
	"number_of_pieces" INTEGER NULL DEFAULT 1,
	"content_description" TEXT NULL DEFAULT NULL,
	"declared_value" NUMERIC(12,2) NULL DEFAULT NULL,
	"package_photo_urls" UNKNOWN NULL DEFAULT NULL,
	"service_type" VARCHAR(20) NOT NULL DEFAULT 'surface',
	"status" VARCHAR(30) NOT NULL DEFAULT 'booked',
	"base_amount" NUMERIC(12,2) NOT NULL DEFAULT '0',
	"additional_charges" NUMERIC(12,2) NULL DEFAULT '0',
	"gst_amount" NUMERIC(12,2) NULL DEFAULT '0',
	"total_amount" NUMERIC(12,2) NOT NULL DEFAULT '0',
	"booked_at" TIMESTAMP NULL DEFAULT now(),
	"picked_up_at" TIMESTAMP NULL DEFAULT NULL,
	"delivered_at" TIMESTAMP NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"branch_id" VARCHAR NULL DEFAULT NULL,
	"is_demo" BOOLEAN NULL DEFAULT false,
	"external_awb" VARCHAR(100) NULL DEFAULT NULL,
	"partner_sync_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
	"partner_sync_error" TEXT NULL DEFAULT NULL,
	"partner_synced_at" TIMESTAMP NULL DEFAULT NULL,
	"packages" JSONB NULL DEFAULT NULL,
	"sender_address_line2" TEXT NULL DEFAULT NULL,
	"receiver_address_line2" TEXT NULL DEFAULT NULL,
	"xgoo_order_id" VARCHAR(32) NULL DEFAULT NULL,
	"shipment_type" VARCHAR(30) NOT NULL DEFAULT 'domestic',
	"destination_country" VARCHAR(100) NULL DEFAULT NULL,
	"pickup_location_name" VARCHAR(500) NULL DEFAULT NULL,
	"channel_order_id" VARCHAR(100) NULL DEFAULT NULL,
	"order_date" VARCHAR(10) NULL DEFAULT NULL,
	"sender_email" VARCHAR(255) NULL DEFAULT NULL,
	"sender_alternate_phone" VARCHAR(20) NULL DEFAULT NULL,
	"sender_landmark" TEXT NULL DEFAULT NULL,
	"sender_country" VARCHAR(100) NULL DEFAULT NULL,
	"receiver_email" VARCHAR(255) NULL DEFAULT NULL,
	"receiver_alternate_phone" VARCHAR(20) NULL DEFAULT NULL,
	"receiver_landmark" TEXT NULL DEFAULT NULL,
	"receiver_country" VARCHAR(100) NULL DEFAULT NULL,
	"products" JSONB NULL DEFAULT NULL,
	"order_payment_type" VARCHAR(20) NOT NULL DEFAULT 'prepaid',
	"collectable_amount" NUMERIC(12,2) NULL DEFAULT NULL,
	"shipping_charges" NUMERIC(12,2) NULL DEFAULT NULL,
	"giftwrap_charges" NUMERIC(12,2) NULL DEFAULT NULL,
	"transaction_charges" NUMERIC(12,2) NULL DEFAULT NULL,
	"reseller_name" VARCHAR(255) NULL DEFAULT NULL,
	"customs_document_type" VARCHAR(20) NULL DEFAULT NULL,
	"inco_terms" VARCHAR(20) NULL DEFAULT NULL,
	"invoice_number" VARCHAR(100) NULL DEFAULT NULL,
	"invoice_date" VARCHAR(10) NULL DEFAULT NULL,
	"currency" VARCHAR(10) NULL DEFAULT NULL,
	"gstin" VARCHAR(20) NULL DEFAULT NULL,
	"iec" VARCHAR(20) NULL DEFAULT NULL,
	"ioss" VARCHAR(40) NULL DEFAULT NULL,
	"eori" VARCHAR(40) NULL DEFAULT NULL,
	"shipment_purpose" VARCHAR(100) NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "shipments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "shipments_courier_partner_id_courier_partners_id_fk" FOREIGN KEY ("courier_partner_id") REFERENCES "courier_partners" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "shipments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT "shipments_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
)
CREATE INDEX "idx_shipments_office" ON "" ("office_id");
CREATE INDEX "idx_shipments_customer" ON "" ("customer_id");
CREATE INDEX "idx_shipments_partner" ON "" ("courier_partner_id");
CREATE INDEX "idx_shipments_booking" ON "" ("booking_number");
CREATE INDEX "idx_shipments_awb" ON "" ("awb_number");
CREATE INDEX "idx_shipments_status" ON "" ("status");
CREATE INDEX "idx_shipments_booked_at" ON "" ("booked_at");
CREATE INDEX "idx_shipments_xgoo_order_id" ON "" ("xgoo_order_id");;

-- Dumping data for table public.shipments: 14 rows
INSERT INTO "shipments" ("id", "office_id", "customer_id", "courier_partner_id", "booking_number", "awb_number", "sender_name", "sender_phone", "sender_address", "sender_city", "sender_state", "sender_pincode", "receiver_name", "receiver_phone", "receiver_address", "receiver_city", "receiver_state", "receiver_pincode", "weight", "length", "width", "height", "volumetric_weight", "chargeable_weight", "number_of_pieces", "content_description", "declared_value", "package_photo_urls", "service_type", "status", "base_amount", "additional_charges", "gst_amount", "total_amount", "booked_at", "picked_up_at", "delivered_at", "created_at", "updated_at", "branch_id", "is_demo", "external_awb", "partner_sync_status", "partner_sync_error", "partner_synced_at", "packages", "sender_address_line2", "receiver_address_line2", "xgoo_order_id", "shipment_type", "destination_country", "pickup_location_name", "channel_order_id", "order_date", "sender_email", "sender_alternate_phone", "sender_landmark", "sender_country", "receiver_email", "receiver_alternate_phone", "receiver_landmark", "receiver_country", "products", "order_payment_type", "collectable_amount", "shipping_charges", "giftwrap_charges", "transaction_charges", "reseller_name", "customs_document_type", "inco_terms", "invoice_number", "invoice_date", "currency", "gstin", "iec", "ioss", "eori", "shipment_purpose") VALUES
	('0242ff84-a458-49ed-8d4b-405a2ce4b964', '35329240-859e-4d67-a256-53eb2b96cd58', '561c5ce7-6ed7-4a91-b15e-b8a86fb03a6b', 'c8e50281-3154-4668-91d1-dd9404babff1', 'XGML8SRCFZ19H', 'DT11111111', 'Tech Solutions', '9812345673', 'Tower A, IT Park', 'Bangalore', 'Karnataka', '560001', 'Global Tech', '9595959595', 'Cyber Hub, Phase 3', 'Hyderabad', 'Telangana', '500001', 3.00, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'air', 'booked', 280.00, 0.00, 0.00, 280.00, '2026-02-05 01:47:53.653', NULL, NULL, '2026-02-05 01:47:53.664', '2026-02-05 01:47:53.664', NULL, 'false', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('1b148447-cf37-40a1-9fa2-99a7eec3f0a6', '35329240-859e-4d67-a256-53eb2b96cd58', NULL, '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'XGMSZ3D0HH7AN', NULL, 'XGoo Test Sender', '9876500001', 'Plot 12, HITEC City, Madhapur', 'Hyderabad', 'Telangana', '500081', 'World First Test Consignee', '9876500002', '14 MG Road, Ashok Nagar', 'Bengaluru', 'Karnataka', '560001', 2.50, 30.00, 20.00, 15.00, NULL, NULL, 1, 'Documents (dummy test — do not dispatch)', 1000.00, NULL, 'air', 'booked', 0.00, 0.00, 0.00, 0.00, '2026-08-18 20:04:38.19635', NULL, NULL, '2026-08-18 20:04:38.19635', '2026-09-26 17:50:49.262', NULL, 'true', NULL, 'opened', 'World First requires OTP login on Xpresion, then Autofill. Workflow: Open World First Xpresion → Log in — OTP required → Open shipment creation → Enter sender / shipper → Enter consignee → Enter package and weight → Enter contents and declared value → Review and submit on World First → Capture AWB in XGoo. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.', NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('1d9a915d-e3f3-42bb-b023-010fc31065f3', '35329240-859e-4d67-a256-53eb2b96cd58', NULL, '5026ddb3-bc3f-4817-9c02-33a141bb56e9', 'XGMRADITOTA3K', '38566010008120', 'COURIER POINT', '8957469173', 'Cyber Valley, Road, near RTO Kondapur Road, Subhash Chandra Bose Nagar, office, Hafeezpet, Hyderabad, Telangana 500049', 'Hyderabad', 'Telangana', '500049', 'Amritpal Singh', '9877649090', '2, Gobind Enclave Greens Inner Rd, Sector 117, Sahibzada Ajit Singh Nagar, Punjab 160055', 'Punjab', 'Sahibzada Ajit Singh Nagar', '160055', 65.50, 72.00, 43.00, 43.00, NULL, NULL, 4, 'Box 1, Box 1, Box 1, Box 1', 20000.00, '{}', 'surface', 'cancelled', 1682.50, 0.00, 0.00, 1682.50, '2026-07-07 08:15:08.658547', NULL, NULL, '2026-07-07 08:15:08.658547', '2026-08-19 10:38:02.708', NULL, 'false', '38566010008120', 'synced', 'Cancelled on Delhivery (38566010008120)', '2026-08-19 09:54:24.824', NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('223fbfb4-2e6c-45c3-b48b-180b94c95628', '35329240-859e-4d67-a256-53eb2b96cd58', '5251b1ca-98f8-4a99-988e-1833002e8e86', '15999cf8-9033-4306-99aa-10afd3f5f764', 'XGMR6LYFS6XRC', 'DT12345678', 'Sharma Electronics', '9812345670', '123 Market Street, Sector 15', 'Noida', 'Uttar Pradesh', '201301', 'ABC Traders', '9898989898', 'Shop 45, Main Bazar', 'Mumbai', 'Maharashtra', '400001', 2.50, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'surface', 'delivered', 125.00, 0.00, 0.00, 125.00, '2026-07-02 17:00:08.933', NULL, '2026-07-03 17:00:08.933', '2026-07-04 17:00:09.384858', '2026-07-04 17:00:09.384858', NULL, 'true', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('338d0bc3-91a7-495d-95cb-f7180483f447', '35329240-859e-4d67-a256-53eb2b96cd58', '81408848-bdb2-44c5-a6fc-358cb8cb9feb', 'b9597207-11c3-4e80-a0e7-896f3a8e8353', 'XGMR6LYFW4R0L', 'FX98765432', 'Raj Enterprises', '9812345671', '456 Industrial Area', 'Gurgaon', 'Haryana', '122001', 'XYZ Corporation', '9797979797', 'Corporate Tower, Business District', 'Chennai', 'Tamil Nadu', '600001', 5.00, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'air', 'in_transit', 600.00, 0.00, 0.00, 600.00, '2026-07-03 17:00:08.933', NULL, NULL, '2026-07-04 17:00:09.527072', '2026-07-04 17:00:09.527072', NULL, 'true', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('495461be-03f1-461c-b84d-cd1db5ea97c2', '35329240-859e-4d67-a256-53eb2b96cd58', '561c5ce7-6ed7-4a91-b15e-b8a86fb03a6b', '5921462c-4e6f-46e4-940f-5fa56d7225b4', 'XGMLB1AF1ML1H', 'ABCD456890FGYD', 'Tech Solutions Pvt Ltd', '9812345673', 'Tower A, IT Park', 'Bangalore', 'Karnataka', '560001', 'Sanjeev Nihal', '7799846684', 'Marasandra, Yelahanka, Dodaballapur Road
D4-002', 'Bangalore', 'Karnataka', '562163', 10.00, 25.00, 35.00, 15.00, NULL, NULL, 12, 'Electronics ', 5000.00, NULL, 'surface', 'booked', 295.00, 0.00, 0.00, 295.00, '2026-02-06 15:22:12.781', NULL, NULL, '2026-02-06 15:22:12.781', '2026-02-06 15:22:12.781', NULL, 'false', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('4e485f52-0b48-4bb6-a29d-8d12785833bb', '35329240-859e-4d67-a256-53eb2b96cd58', '54152642-6219-4aa6-8256-f104f9f20750', '8686cc80-9bea-45b1-9ce2-dc32d86cc6d7', 'XGML8SRCFWX42', 'BD55555555', 'Priya Gupta', '9812345672', '789 Residential Colony', 'Delhi', 'Delhi', '110001', 'Vikram Gupta', '9696969696', '456 Lake View Apartments', 'Pune', 'Maharashtra', '411001', 1.00, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'surface', 'picked_up', 100.00, 0.00, 0.00, 100.00, '2026-02-05 01:47:53.653', '2026-02-05 01:47:53.653', NULL, '2026-02-05 01:47:53.661', '2026-02-05 01:47:53.661', NULL, 'false', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('6d52cd6a-3e89-4c95-9bfa-d023c25b4c2f', '35329240-859e-4d67-a256-53eb2b96cd58', NULL, '5921462c-4e6f-46e4-940f-5fa56d7225b4', 'XGML8SRCG47N3', NULL, 'Walk-in Customer', '9999999999', 'Local Address', 'Delhi', 'Delhi', '110002', 'Quick Delivery', '8888888888', 'Remote Location', 'Jaipur', 'Rajasthan', '302001', 0.50, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'surface', 'booked', 57.50, 0.00, 0.00, 57.50, '2026-02-05 01:47:53.653', NULL, NULL, '2026-02-05 01:47:53.669', '2026-02-05 01:47:53.669', NULL, 'false', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('7470560a-05df-4d21-9d92-a8e16e5b8405', '35329240-859e-4d67-a256-53eb2b96cd58', 'a00db5b6-9273-411c-bf7a-2f1a88b31463', '15999cf8-9033-4306-99aa-10afd3f5f764', 'XGMR6LYG3RBQ6', 'DT11111111', 'Tech Solutions', '9812345673', 'Tower A, IT Park', 'Bangalore', 'Karnataka', '560001', 'Global Tech', '9595959595', 'Cyber Hub, Phase 3', 'Hyderabad', 'Telangana', '500001', 3.00, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'air', 'booked', 280.00, 0.00, 0.00, 280.00, '2026-07-04 17:00:08.933', NULL, NULL, '2026-07-04 17:00:09.802775', '2026-07-04 17:00:09.802775', NULL, 'true', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('81930a7a-5610-40cb-a80e-0a2ebbffbf7c', '35329240-859e-4d67-a256-53eb2b96cd58', '8858f683-612c-4738-a2a4-c6f9465fde43', '0d4ab644-6c61-445b-9758-ac6fd500b776', 'XGML8SRCFTENT', 'FX98765432', 'Raj Enterprises', '9812345671', '456 Industrial Area', 'Gurgaon', 'Haryana', '122001', 'XYZ Corporation', '9797979797', 'Corporate Tower, Business District', 'Chennai', 'Tamil Nadu', '600001', 5.00, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'air', 'in_transit', 600.00, 0.00, 0.00, 600.00, '2026-02-04 01:47:53.653', NULL, NULL, '2026-02-05 01:47:53.658', '2026-02-05 01:47:53.658', NULL, 'false', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('824ded62-f98b-4fef-864b-516a32d4f080', '35329240-859e-4d67-a256-53eb2b96cd58', NULL, '5026ddb3-bc3f-4817-9c02-33a141bb56e9', 'XGMR6LYG7LH7S', NULL, 'Walk-in Customer', '9999999999', 'Local Address', 'Delhi', 'Delhi', '110002', 'Quick Delivery', '8888888888', 'Remote Location', 'Jaipur', 'Rajasthan', '302001', 0.50, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'surface', 'booked', 57.50, 0.00, 0.00, 57.50, '2026-07-04 17:00:08.933', NULL, NULL, '2026-07-04 17:00:09.938536', '2026-08-19 08:55:14.361', NULL, 'true', NULL, 'failed', 'Delhivery returned invalid JSON (401): Login or API Key Required', NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('c76ead94-bbd1-460b-ae97-56f57388d669', '35329240-859e-4d67-a256-53eb2b96cd58', 'f8694b3f-c536-45c8-991d-629a0ca8a848', 'c8e50281-3154-4668-91d1-dd9404babff1', 'XGML8SRCFP028', 'DT12345678', 'Sharma Electronics', '9812345670', '123 Market Street, Sector 15', 'Noida', 'Uttar Pradesh', '201301', 'ABC Traders', '9898989898', 'Shop 45, Main Bazar', 'Mumbai', 'Maharashtra', '400001', 2.50, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'surface', 'delivered', 125.00, 0.00, 0.00, 125.00, '2026-02-03 01:47:53.653', NULL, '2026-02-04 01:47:53.653', '2026-02-05 01:47:53.654', '2026-02-05 01:47:53.654', NULL, 'false', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('e9ed8712-3d56-4da5-8922-115468b019b8', '35329240-859e-4d67-a256-53eb2b96cd58', '00543eb9-6118-4d06-944d-628bb64a0667', '985a1a59-666d-42bd-9814-a629b455ad18', 'XGMR6LYFZX8WS', 'BD55555555', 'Priya Gupta', '9812345672', '789 Residential Colony', 'Delhi', 'Delhi', '110001', 'Vikram Gupta', '9696969696', '456 Lake View Apartments', 'Pune', 'Maharashtra', '411001', 1.00, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, 'surface', 'picked_up', 100.00, 0.00, 0.00, 100.00, '2026-07-04 17:00:08.933', '2026-07-04 17:00:08.933', NULL, '2026-07-04 17:00:09.664655', '2026-08-20 05:29:52.501', NULL, 'true', NULL, 'opened', 'Open Blue Dart and finish booking in the partner portal. Capture the AWB when done.', NULL, NULL, NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('fd325b73-8b8a-4909-b6aa-c1969ed66864', '35329240-859e-4d67-a256-53eb2b96cd58', NULL, 'b9597207-11c3-4e80-a0e7-896f3a8e8353', 'XGMRDJKW9D0S9', '7451564112231232', 'Nihal', '7799846684', 'Satyam Valley, Villa No 2, Rajeev Gandhi Nagar, Bachupally, Hyderabad', 'Hyderabad', 'Telangana', '500090', 'SWETHA SINGARI', '9966032234', 'Satyam Valley, Villa No 2, Raj
Bachupally, Qutubullapur', 'K.V.Rangareddy', 'Telangana', '500090', 45.00, NULL, NULL, NULL, NULL, NULL, 1, 'CLOTHS', 4998.00, '{}', 'surface', 'in_transit', 5000.00, 0.00, 0.00, 5000.00, '2026-07-09 13:28:02.094119', '2026-07-09 13:31:07.116', NULL, '2026-07-09 13:28:02.094119', '2026-07-09 13:31:28.203', NULL, 'false', NULL, 'pending', NULL, NULL, '[{"width": "", "height": "", "length": "", "weight": "45.00", "declaredValue": "4998.00", "numberOfPieces": "1", "contentDescription": "CLOTHS"}]', NULL, NULL, NULL, 'domestic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'prepaid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Dumping structure for table public.tariff_rate_rows
CREATE TABLE IF NOT EXISTS "tariff_rate_rows" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"tariff_version_id" VARCHAR NOT NULL,
	"office_id" VARCHAR NOT NULL,
	"courier_partner_id" VARCHAR NOT NULL,
	"service_type" VARCHAR(20) NOT NULL DEFAULT 'surface',
	"origin_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"destination_pincode" VARCHAR(10) NULL DEFAULT NULL,
	"origin_zone" VARCHAR(50) NULL DEFAULT NULL,
	"destination_zone" VARCHAR(50) NULL DEFAULT NULL,
	"weight_min" NUMERIC(10,2) NOT NULL DEFAULT '0',
	"weight_max" NUMERIC(10,2) NOT NULL DEFAULT '999',
	"tariff_amount" NUMERIC(12,2) NOT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"shipment_type" VARCHAR(30) NULL DEFAULT 'domestic',
	"origin_country" VARCHAR(100) NULL DEFAULT 'IN',
	"destination_country" VARCHAR(100) NULL DEFAULT NULL,
	"fixed_margin" NUMERIC(12,2) NULL DEFAULT '0',
	"percentage_margin" NUMERIC(8,2) NULL DEFAULT '0',
	"affiliate_margin" NUMERIC(12,2) NULL DEFAULT '0',
	"offer_discount" NUMERIC(12,2) NULL DEFAULT '0',
	"fuel_charge" NUMERIC(12,2) NULL DEFAULT '0',
	"handling_charge" NUMERIC(12,2) NULL DEFAULT '0',
	"insurance_charge" NUMERIC(12,2) NULL DEFAULT '0',
	"remote_area_charge" NUMERIC(12,2) NULL DEFAULT '0',
	"gst" NUMERIC(12,2) NULL DEFAULT '0',
	"customer_price" NUMERIC(12,2) NULL DEFAULT '0',
	"transit_days" INTEGER NULL DEFAULT NULL,
	"is_active" BOOLEAN NULL DEFAULT true,
	"notes" TEXT NULL DEFAULT NULL,
	"custom_fields" JSONB NULL DEFAULT '{}',
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"updated_by" VARCHAR NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT "tariff_rate_rows_courier_partner_id_courier_partners_id_fk" FOREIGN KEY ("courier_partner_id") REFERENCES "courier_partners" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT "tariff_rate_rows_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT "tariff_rate_rows_tariff_version_id_tariff_versions_id_fk" FOREIGN KEY ("tariff_version_id") REFERENCES "tariff_versions" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
)
CREATE INDEX "idx_tariff_rate_rows_version" ON "" ("tariff_version_id");
CREATE INDEX "idx_tariff_rate_rows_partner" ON "" ("courier_partner_id");
CREATE INDEX "idx_tariff_rate_rows_lookup" ON "" ("office_id", "courier_partner_id", "service_type");;

-- Dumping data for table public.tariff_rate_rows: 270 rows
INSERT INTO "tariff_rate_rows" ("id", "tariff_version_id", "office_id", "courier_partner_id", "service_type", "origin_pincode", "destination_pincode", "origin_zone", "destination_zone", "weight_min", "weight_max", "tariff_amount", "created_at", "shipment_type", "origin_country", "destination_country", "fixed_margin", "percentage_margin", "affiliate_margin", "offer_discount", "fuel_charge", "handling_charge", "insurance_charge", "remote_area_charge", "gst", "customer_price", "transit_days", "is_active", "notes", "custom_fields", "updated_at", "updated_by") VALUES
	('0080d9b0-e41a-45fd-9a69-38d2c8f0cdf0', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.50, 15421.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 24673.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:32.748', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('00fabee1-9a0b-4194-be84-e318a59fd546', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.50, 11679.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11679.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('026a5f7c-02a8-4308-9dfe-12fd025f5fc3', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.00, 5600.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5600.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('0390faff-d9c2-4a4a-afa4-cc11eb6d7fa5', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.00, 10366.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10366.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('046f9986-f6a8-43b9-9479-1e538ac5302b', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 45.00, 70.00, 738.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 738.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:19:11.573437', NULL),
	('04fb384c-6fb2-40c6-bcc0-2d11bb667843', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.50, 13939.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13939.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('05514cc2-245a-4c58-85cd-b69d93368a92', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.50, 11679.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11679.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('07e220b5-3e57-4391-8582-6bbc5ea980b9', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.50, 7822.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7822.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('095b315b-a59f-4f95-9c1f-48fc9b53775d', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.00, 5788.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5788.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('0994e613-d772-4d14-8e00-e230b5dcfaf6', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.50, 6683.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6683.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('0a5e9816-5b77-4629-9c3c-a4c7a494f8df', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.00, 4702.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7523.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:27.016', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('0a8ab562-c1d6-489b-b7a8-bdb4901e3e39', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.50, 4162.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6659.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:26.897', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('0b023088-a23d-43af-9ee1-1c541dfa89f5', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.00, 6317.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6317.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('0bdede7d-8433-400d-8d8e-5ed308d98134', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.00, 3622.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3622.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('0c2974df-1e93-4afc-9cdf-a0a0961c9eca', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.50, 6068.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6068.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('0cb5dcb3-ab39-463f-9deb-fe0c0abfeb8f', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.00, 5788.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9260.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:27.614', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('0cd4e5a7-d916-4e22-b841-b689a089312e', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.00, 4399.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7038.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:34.462', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('0d81806d-3f6d-4264-b392-bf2ff653707c', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.00, 12016.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12016.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('0da92832-d802-4fa1-bfec-0cdea92ccd2b', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.00, 15764.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 25222.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:35.811', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('10d34d91-6800-4658-9ba1-c42c44020b55', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.50, 4162.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4162.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('11d5ce5a-94ea-4eb1-adf1-07df4c7f360e', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 100.00, 299.00, 695.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 695.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:19:11.573437', NULL),
	('12c0ba08-aca4-4f5d-8a68-b54a779cb37f', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.00, 12742.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 20387.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:35.566', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('150c79f4-1c39-4196-888f-79d6113969cf', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.50, 6683.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6683.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('15c629ba-1466-474f-bd00-8bf6cb4f1437', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 70.00, 738.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1180.80, NULL, 'true', 'rate_type=per_kg', '{}', '2026-09-01 08:23:33.481', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('17694794-af63-48c2-9e4a-5cb98cc84b62', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.50, 13145.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 21032.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:31.769', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('18c18ae0-be37-493e-85a1-8cf628ea6ff5', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.50, 7185.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11496.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:28.705', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('191b04c1-2708-4c52-94f0-cee13496e63a', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.00, 12016.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12016.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('19590a80-07ff-4045-9051-46bc817f042e', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.50, 13939.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13939.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('19bac569-9515-45c9-a0cb-88b5335e6344', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 20.00, 15922.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15922.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('19e23216-dc29-4db6-80cf-03426e095bc2', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.50, 13145.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13145.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('1b53aa6a-bbd8-4c95-9af8-a3cf100ab5e0', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.50, 14733.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14733.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('1b99e662-489f-4578-87bc-292bed44f552', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 100.00, 299.00, 735.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 735.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:19:11.573437', NULL),
	('1bacfb9a-39d7-45cf-916f-701b3e1775b7', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.00, 9578.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15324.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:35.195', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('1beca467-57c7-4e59-b986-1a2cb3d47628', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.50, 11679.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 18686.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:31.019', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('1bfc8e58-0a19-4cc9-8ecd-5e4c726826e1', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.00, 7998.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7998.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('1f24f2bd-ae8e-4aeb-afe6-9176c5f4ae43', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 71.00, 99.00, 734.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 734.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:19:11.573437', NULL),
	('1fbd006a-8e6e-402f-9afa-6d06a93f2f84', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.00, 12742.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12742.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('205278c9-4964-4468-bd98-ea5825030fec', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.00, 13767.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13767.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('214097bd-bd37-458e-9a6c-1881bf6883e4', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 44.00, 732.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1171.20, NULL, 'true', 'rate_type=per_kg', '{}', '2026-09-01 08:23:33.36', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('22cfe49c-0d6d-41b0-bc3b-93477d82388f', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.00, 3569.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3569.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('245fab76-a909-48ff-a4a2-321d956b3e66', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.50, 15526.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15526.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('2528705a-3013-480a-b063-12cb936c0a72', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.00, 12016.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 19225.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:31.266', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('25dcaa32-929e-41b8-98a5-9c97a4666063', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.50, 6627.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6627.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('25f186ce-9c4e-40c1-97f9-8cb29a66411b', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.00, 15076.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15076.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('263beac0-3d3f-419b-aa22-5fe857a32851', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.50, 5149.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5149.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('27895310-21d8-4f3e-8eb2-a081e05fc40e', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1512.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 50.00, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2318.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:25.562', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('28893cc4-e879-4a22-a1c3-b90113076511', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.50, 8134.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8134.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('2ca2b002-c3d6-4f80-8b7c-aa86d007dd50', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.00, 6317.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6317.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('2cb74264-a9de-4152-8e5a-900ea430ad5a', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.00, 11154.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11154.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('2dbac50c-22dc-4763-8027-898c1b5547f0', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.50, 3140.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3140.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('2e8bbbbf-1842-49f9-9d96-be08b565652b', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 20.00, 15922.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 25475.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:33.113', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('3063c97f-33c4-4b35-adf8-c4b1323178c3', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.00, 14406.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 23049.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:32.134', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('31b2ad98-d02d-4b24-9a14-de48969937c6', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.00, 6317.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10107.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:27.735', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('321a3181-6dda-474e-9d62-e91500f0619e', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.50, 14095.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14095.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('32407b58-4cd1-4a92-8192-b30929d0d7e6', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.00, 15076.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 24121.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:32.503', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('326c2a9b-16e7-4dd2-9457-afef2c43ba8d', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.00, 3622.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3622.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('3287e54f-4420-4f56-80a7-52149eebf5e9', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.00, 9578.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9578.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('32c29477-5c35-4e49-9006-ed6ef9990c64', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.00, 11355.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 18168.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:35.443', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('33cb8e15-b39e-401f-917d-808fd2e5565f', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.50, 4814.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7702.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:27.135', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('33e3cc01-d73a-4c50-bc37-730bdb3330ba', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.00, 9343.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9343.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('3567591d-b74e-4c6c-ac56-137621bb55eb', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.00, 11154.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11154.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('3597ea82-9ec2-4e55-8df9-2c29edb4f891', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1660.00, '2026-07-18 14:28:20.179504', 'Document', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1660.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('37a72610-0042-4225-8c47-23f888dcbc94', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 44.00, 733.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1172.80, NULL, 'true', 'rate_type=per_kg', '{}', '2026-09-01 08:23:36.3', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('398261b2-b2de-4f8c-b47d-8f0a76e7f55a', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.50, 5509.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5509.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('3983e9ed-e521-4cd6-af8b-42c5a1a107e9', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.50, 16116.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 16116.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('3a9f716b-4caa-48e2-b0ad-212a7436b544', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.50, 3985.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6376.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:26.777', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('3ac2b217-0540-47eb-8c18-c4c86af6f466', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.00, 2790.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2790.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('3b1028f6-ee49-4e84-96ff-97cf982433b2', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.50, 3133.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3133.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('3c9ad432-4941-4168-aa8e-c6c10cc8ca58', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.50, 14733.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14733.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('3cb225af-3590-4fca-81b6-99fa699e9542', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.50, 14734.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14734.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('3d723ad3-a29a-4036-8486-6aab972985a0', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.50, 13448.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13448.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('3dc81981-ed9b-459c-9b50-52e7932a6d29', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.50, 10383.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10383.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('3f341692-23cb-4e2a-93bd-41b8f54e53cb', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.50, 8392.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13427.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:29.555', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('3f52626c-0740-44cc-8e6a-eb3e20341ec8', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.50, 2358.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3772.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:26.051', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('404da054-89db-4a63-b713-b2bcb49809d7', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.50, 14734.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14734.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('40d2aeb3-d488-49fe-b678-d9bf53968f53', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.50, 16116.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 16116.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('40e4c92c-8667-4056-b0fe-6720f16f99ad', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 21.00, 44.00, 732.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 732.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:28:20.179504', NULL),
	('411ebf99-60dc-4ed2-8c7f-1cc3d1395248', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.00, 10366.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 16585.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:30.409', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('4138a92d-cbbf-4524-83ee-d071042d9ffc', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.00, 7998.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7998.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('416b8f8b-3cc5-44dc-98ec-7f18b91cde15', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.00, 3569.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3569.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('423910ea-c1e2-43f6-9b3c-a8b9f0dcde13', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.50, 9180.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9180.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('4252ff4f-2562-4a2f-8967-e0cf632ddae2', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.50, 8842.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14147.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:29.193', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('430d0fc4-7375-4809-a75c-bfebb968e242', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 21.00, 44.00, 732.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 732.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:19:11.573437', NULL),
	('43303770-fa73-424c-88f4-c7fca26fcb77', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 71.00, 99.00, 694.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 694.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:28:20.179504', NULL),
	('443f83d6-1c01-40ba-a8ee-1ca9c66f50d2', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.50, 8996.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8996.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('45cae4f8-3c82-4e3d-b247-db1bfdfef559', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.00, 2106.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 50.00, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3209.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:25.683', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('45f61f7d-1722-42b3-8c05-aa4c6a391804', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.50, 6683.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10692.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:27.975', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('47ae32f0-0849-4bde-9f6d-24d6bf53863d', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.50, 15526.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 24841.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:35.934', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('4868a362-7077-4c9c-9d12-160261863055', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.00, 7044.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7044.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('49356d49-efe3-4b57-8d61-f0a49c4dce27', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 21.00, 44.00, 733.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 733.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:19:11.573437', NULL),
	('496bed4e-e58b-4363-a538-53f4c9fcc5bc', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.00, 7467.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7467.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('49c32622-6744-4a3b-abf3-3608e26ac279', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.50, 9180.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9180.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('4a0c4c1d-7611-48c3-b19c-8bd652db8de2', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.00, 2586.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2586.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('4dcec82a-bcf6-4193-a666-789dd6e668c5', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 71.00, 99.00, 694.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 694.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:19:11.573437', NULL),
	('4e732a32-a2e9-46f6-8adf-29bc67d6c314', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.50, 5149.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8238.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:34.585', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('4ec87011-768d-4e0c-b554-818383e39e32', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.50, 9691.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15505.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:30.041', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('4f4f8801-fd12-4a35-9ca5-4abd5295a24f', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.50, 11550.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 18480.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:30.897', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('501ad5cc-a178-432a-8b35-180bf268d054', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1512.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1512.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('530a23c5-f2bc-4f31-a6e1-4d9eb7c0fe8a', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.00, 10706.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 17129.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:30.529', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('53a62e3d-0fa4-486b-8754-733cbd06f537', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.00, 10706.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10706.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('555bfb49-72c4-47f9-945f-bc4276a275bd', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.00, 15764.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15764.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('56f996f6-5cbf-4a61-aaf0-8e60b9050a2d', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.50, 2358.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2358.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('5797fc5b-8ebc-4a2f-a108-77fdf8a71326', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.00, 3622.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5795.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:26.656', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('57a5907e-287a-4b81-ba6c-d6aa2ec6c761', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.00, 2790.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4464.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:26.173', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('57b8e1de-5e9d-4e20-b319-5797ca730398', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.50, 8392.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8392.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('5888b857-9970-4343-9c89-3477b0feb47a', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.00, 6348.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10156.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:28.096', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('5afd22b6-f3ef-4762-a2ab-46f5da5bdfd0', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1771.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 50.00, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2706.50, NULL, 'true', NULL, '{}', '2026-09-01 08:23:25.436', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('5b6e412b-d9d3-4594-876f-ca5250e047a7', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.50, 7185.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7185.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('5c184e5f-b934-4399-87a9-605e33de3dea', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.50, 9691.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9691.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('5c29c229-c3f5-476c-a381-383b48bc0097', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.00, 15132.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15132.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('5d4ee07d-43f2-46f8-933c-b97c9d760c82', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.50, 3140.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3140.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('5f08d2ff-11ea-495c-82a4-5be9af1af69f', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.00, 10706.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10706.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('61faef6b-4594-407e-921b-9b792260bcc9', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.50, 11029.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 17646.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:36.178', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('6804304d-5297-48a8-bb3a-60fb11be1c6a', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.00, 14406.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14406.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('6925961d-5b62-4961-a75e-eecab544ef74', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.00, 10031.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 16049.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:30.166', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('6b6c1775-ca6d-4826-a02b-8c3fc85214e1', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.50, 7822.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12515.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:34.952', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('6b89ee1a-a384-46ff-a740-e2f7c4858cee', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.00, 7044.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11270.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:28.218', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('6c590113-ff0e-489d-b25e-335c2fc12aa0', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.00, 6348.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6348.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('6cc7e3e4-fb89-446e-bd1f-076e3cdd8cd6', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.50, 2449.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2449.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('6fd949ef-33b7-4cab-9eda-31603d2ead6e', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.50, 6627.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6627.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('7176e72d-8ad8-4c4a-85da-c157e0e0eb5d', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.00, 9343.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14948.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:35.073', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('71b8ea0a-5492-4583-8e67-891a914c5b42', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.00, 14341.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14341.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('732d1aa2-a8fd-4d49-b617-930a167dd286', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.50, 11550.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11550.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('73a07adc-be02-4f72-b21d-20ecc9ae30bd', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 45.00, 70.00, 738.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 738.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:28:20.179504', NULL),
	('74c000a3-a8c9-4d5b-98da-4080527d15a8', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1771.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1771.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('76d6027a-18ea-4dd5-8861-a199eca0ba93', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.50, 14095.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14095.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('76dbab51-e323-4a98-a44b-1b5dee45dc24', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.50, 12348.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12348.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('772d96ef-44a1-400b-b8e2-efb74aa85d2a', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.50, 3133.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5012.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:26.293', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('77c2d6d0-5edd-4ecc-b686-ff43f4ad03ff', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.50, 9691.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9691.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('77c408da-5c93-4cf9-86a8-40756dbdb260', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.00, 9175.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9175.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('7800e21b-c0f3-488e-b741-a6b263f73936', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.50, 14734.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 23574.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:32.625', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('7957bbb0-286e-4d59-ad45-c54e4fbf4ee8', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.50, 16116.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 25785.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:32.991', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('7962f412-5125-4713-8071-bd18245c548b', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 100.00, 299.00, 735.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 735.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:28:20.179504', NULL),
	('79c727d6-15e3-41c3-a78f-0e7972bde894', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.00, 12742.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12742.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('7ab6f29b-4b46-4cc8-a954-7ec932b9e909', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.50, 11550.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11550.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('7b0c3540-338a-4af5-aff0-badb6cde7027', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.50, 3985.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3985.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('7b1f27c2-989e-4499-9421-d93b89248c84', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.00, 5229.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8366.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:27.255', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('7c190ad2-113f-4e85-8e02-1273cac32501', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.50, 3985.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3985.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('7d99a481-e150-47e8-8754-b9b4b34e7e42', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.00, 4399.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4399.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('81cc18f5-4119-4ac5-92a0-898cd8e818dd', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.50, 3133.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3133.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('82883f2a-9df0-4ae1-903d-a14a37f9a318', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.50, 8842.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8842.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('82965276-cdd3-4fa2-947c-311bd14e9cea', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.00, 13767.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13767.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('840e4244-5328-4661-adaf-682b592ae88b', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1498.00, '2026-07-18 14:19:11.573437', 'Document', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1498.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('855844a0-2e40-444e-bf47-044e64e8fe8c', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.00, 11355.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11355.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('85a07ca4-396d-404b-90c5-9b6c5ff419ea', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.00, 14406.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14406.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('85aa2bad-8eaa-419d-9c73-980e64f29877', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.00, 10031.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10031.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('88132854-a572-4550-b343-c44a49454648', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.50, 5509.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5509.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('8879db5c-bb0a-49e3-828a-1fe0a82db0ee', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 20.00, 16451.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 16451.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('8896089e-e17b-410a-9adb-122a87282b60', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.50, 8134.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8134.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('8b79e22d-f25b-44c9-9e00-5e3a40d18e28', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.50, 5953.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5953.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('8bb96a56-ef92-4f7d-a383-930ab1109e23', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 71.00, 99.00, 734.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 734.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:28:20.179504', NULL),
	('8bcd4ff7-0e71-4802-bae1-0c433b933276', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.00, 8495.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8495.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('8c4c9074-8c47-4957-9b26-e46a9810237e', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.50, 2449.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3918.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:25.928', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('8ceb9c8b-c485-4ae2-ba1d-11c4617265a0', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.00, 8495.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8495.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('8d24d36f-c287-4d0e-b303-3126173d2445', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.00, 5788.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5788.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('8f07018b-5f36-4442-b0bc-18fef044eff3', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.00, 7774.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7774.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('8f0f4ee3-cb03-4a2e-b7bf-456f7326ac7c', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1660.00, '2026-07-18 14:19:11.573437', 'Document', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1660.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('8f9f14fe-f0d4-49da-ab5f-414e185857e4', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 20.00, 16451.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 16451.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('8fcccae7-b56f-486e-965d-0a10694a60d4', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.00, 4702.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4702.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('8fefe9c3-1393-40ec-9e38-319fa05f7980', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.50, 10761.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10761.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('905332f3-630a-4961-832c-775ce8a76343', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 99.00, 734.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1174.40, NULL, 'true', 'rate_type=per_kg', '{}', '2026-09-01 08:23:33.726', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('913185f9-59ff-4097-b35f-8c14c6f204c6', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.50, 8392.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8392.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('93a7cc16-7f03-44c0-a355-71d557b46f4b', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.00, 15076.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15076.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('9464f085-672d-4df0-8fac-86bdb82d1726', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.50, 11029.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11029.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('983adf49-2389-4075-a039-e61976115ce8', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.00, 11944.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11944.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('9a472cf8-e787-4367-b598-2b6ebe94c5d7', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 21.00, 44.00, 733.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 733.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:28:20.179504', NULL),
	('9a84c52e-c47f-4783-996f-b8d1e0f901f0', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.00, 2031.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2031.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('9db627d3-948d-4955-9d4b-b8900dccf2b3', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.00, 5229.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5229.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('a0537690-f879-4363-b688-a7dc1256bde0', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.50, 13448.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13448.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('a0991caa-02ba-4af9-aab0-e6ab491c07c5', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.00, 11154.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 17846.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:30.775', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('a0aaf75d-b1eb-4691-a480-799923d80363', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.00, 13543.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13543.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('a0afb180-0659-49c9-82eb-b0018d74775b', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.00, 11944.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11944.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('a267307b-90d2-45c5-bb9f-b78c493cfbdf', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.50, 8996.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14393.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:29.676', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('a3dc8434-bcb0-45a9-a6b9-7e970ea87d70', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.00, 10366.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10366.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('a4b12334-5806-4804-94c9-2faa02b4743b', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.00, 2031.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 50.00, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 3096.50, NULL, 'true', NULL, '{}', '2026-09-01 08:23:25.805', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('a696e1fd-2a7c-4b50-b4dc-69e49649e732', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 45.00, 70.00, 734.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 734.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:19:11.573437', NULL),
	('a76a7ed5-8df1-41f0-8539-485ce22ea3f6', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1498.00, '2026-07-18 14:32:26.588777', 'Document', 'IN', 'CA', 50.00, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2297.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:34.216', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('a82e52a6-27ce-419f-8edb-a1f11d262701', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.50, 7822.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7822.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('a8695fc6-2615-4e88-a057-8e6e58610199', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.50, 4162.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4162.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('a97b74d9-9d0d-4cd0-b5c4-c171c5e250d7', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.00, 15132.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 24211.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:32.87', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('ab145761-06c9-4327-95dd-05b29f636262', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 299.00, 735.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1176.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-09-01 08:23:33.971', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('abfb1ca5-c3ec-45e8-9466-24b810a39408', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.00, 2106.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2106.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('acdcf321-a634-4848-924e-248bf3e0c1ae', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.00, 9175.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9175.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('ae40247f-2178-4745-a7c2-e779d173b8f7', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.50, 8996.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8996.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('afdcae61-9998-4fd6-a3c7-a84fe04e0ccd', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.50, 9969.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9969.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('b129399b-54b6-490c-a417-7403b2a421d1', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.50, 7409.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11854.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:28.338', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('b269d773-9720-4ecb-a51b-14c69d5c93bb', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.50, 9969.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9969.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('b27c5ac7-a3cf-446b-9615-2e82ae805b63', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 100.00, 299.00, 695.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 695.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:28:20.179504', NULL),
	('b349eb94-dc20-4970-a761-5f21994ca690', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.00, 7998.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12796.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:29.313', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('b3f6a27c-845f-45aa-923a-18888d77e2be', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.50, 10761.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10761.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('b4dfc940-2bf5-4e71-9858-199cff427be0', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.00, 2586.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2586.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('b52e55f6-5a05-4def-865b-bbdc2fc7428d', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.00, 8495.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13592.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:29.073', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('b675e0a2-6a8b-4671-87df-a3a5d8783de7', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.50, 7409.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7409.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('b7304826-001e-4f8f-8474-5debd4f50a8d', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.00, 8786.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8786.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('b76b47fc-4e28-45b7-a391-3d8be95234e0', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.50, 13145.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13145.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('b9c9a871-1cd3-4cd0-a88c-b08b2b6ebc5f', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.00, 8786.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8786.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('bab59b92-0c9d-4a73-b83c-0f65e54b7ec1', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.50, 15526.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15526.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('bbd4868d-c7f7-4013-8bc2-68ec9f3fc394', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.00, 7467.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11947.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:28.95', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('bcf8f3db-9e53-4bda-8630-54164e16a25a', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.50, 3140.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5024.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:26.414', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('bcfd0cfc-b932-4b6e-9632-1e20a8eb0788', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.50, 8842.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8842.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('bd01cfba-dbe1-478d-9334-32ab10ece742', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 10.00, 9175.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14680.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:29.434', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('bdf061ca-a7b4-40b2-b4ec-a9af6fcd19d3', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.50, 11029.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11029.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('c04e9a61-ac67-43fd-bda7-3c3b9fd3d225', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.50, 10383.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 16612.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:30.286', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('c12d7e3a-b44a-47fe-bf7c-35087459f65e', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.00, 7774.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12438.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:28.583', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('c26c53a6-b8bb-4821-9e57-23387c6a6123', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.00, 14341.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 22945.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:32.38', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('c325c594-c485-4a87-a1eb-30674e080b7c', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.50, 9180.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14688.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:29.92', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('c542a194-3ceb-4d35-8e01-efdbc3dd17cf', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.50, 2358.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2358.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('c55a410d-51ab-4e8f-84b4-aeb9cfa57dd7', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.00, 6904.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6904.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('c6161b31-93ba-4589-943a-6049c6020c4b', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.50, 13448.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 21516.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:31.523', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('c82cddf5-e2a6-49ba-8875-130ee9d0aa55', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.50, 14733.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 23572.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:35.689', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('c89faf19-6f89-4a18-bf1a-8ffcea2fc93e', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.00, 9343.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9343.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('cb156469-ce7f-4567-bab9-a1223072a796', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.50, 15421.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15421.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('cd675aa9-1925-4d6a-9870-6d6d47b93cf0', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.50, 12348.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 19756.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:31.389', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('cdedf797-2095-444a-94e7-892423fea735', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.50, 5149.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5149.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('d055b8d8-4663-4ef1-b77f-ba49de8b08db', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.00, 6348.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6348.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('d0b01c02-17f6-415b-addf-408e64b4ce78', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.00, 2106.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2106.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('d0c1256a-34be-45d8-b2e8-c779b1f8a937', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.50, 12348.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12348.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('d156c101-a3dc-422a-a2d9-9df8571a573c', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.50, 10383.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10383.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('d19a88a9-2a58-4da4-bdac-1fc501de0f28', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1771.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1771.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('d1b9382a-3e2b-4d43-80e5-d7cab4054e78', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 45.00, 70.00, 734.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 734.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-07-18 14:28:20.179504', NULL),
	('d1d5a571-f23c-4c5a-8fd5-167252f2516e', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.00, 15132.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15132.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('d42cb0b8-bb6d-4a61-b429-c55d2c3ebd32', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.50, 14095.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 22552.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:31.891', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('d47b4344-17a1-4080-a50d-1c545ad59a9f', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.00, 7044.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7044.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('d5e2d91e-e6c5-4b1b-b13b-7b0535349932', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.50, 5509.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8814.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:27.495', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('d5e44e90-822e-4b0c-9b68-bcda318749ab', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 99.00, 694.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1110.40, NULL, 'true', 'rate_type=per_kg', '{}', '2026-09-01 08:23:33.603', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('d909061b-7d1c-479b-89da-be870b1f03d5', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.00, 2586.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4137.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:34.34', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('dbcfa394-b7da-472c-aa06-0ffee54595da', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.00, 6904.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6904.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('dc20cdea-0645-41f5-a68a-1edd23c695e5', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1660.00, '2026-07-18 14:32:26.588777', 'Document', 'IN', 'US', 50.00, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2540.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:34.094', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('dc3b6941-66e6-4e91-a97a-e8939641b9fa', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.50, 7185.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7185.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('de52e6b9-9880-408b-9692-9a7e3f0c6433', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.00, 7774.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7774.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('dea3a58f-dddd-4143-931c-66bf48b1694d', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.00, 10031.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10031.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('df3640f7-e2ff-4750-80e4-0806ea4899f9', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 3.00, 3569.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5710.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:26.536', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('e00cdd98-e729-404a-b8b3-c69d4b4800df', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1512.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1512.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('e0337a82-8bb3-4043-83f4-3a2933fba9a6', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.00, 9578.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9578.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('e0e8172b-18a8-4294-874f-6153939fbac4', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.50, 13939.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 22302.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:32.258', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('e1577f10-aeb1-492d-82f8-66e47507a0e9', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 299.00, 695.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1112.00, NULL, 'true', 'rate_type=per_kg', '{}', '2026-09-01 08:23:33.849', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('e1806672-7b3f-425b-a910-26c05e94d1c1', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.50, 2449.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2449.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('e1c9ddf2-5763-49ad-b230-6f00db8082e5', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.50, 4814.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4814.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('e27a826d-fd18-4d08-a82a-deecce99b275', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 20.00, 16451.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 26321.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:33.236', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('e2dc0ac8-3d6f-4ba0-9e89-47305a8e4025', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.00, 5600.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5600.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('e30e15ad-788d-45d5-a2e1-ca844bef0231', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.50, 4814.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4814.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('e369df51-f05e-428b-892b-fe50891c17b9', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.50, 6627.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 10603.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:34.832', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('e494c05d-f512-4824-8958-72a0f6cc108f', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.50, 15421.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15421.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('e71b6e5a-2a7b-44c8-afc1-ec53d3ae992f', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 2.00, 2790.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2790.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('e728c758-b128-43e3-952f-30ef73057b16', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.50, 8134.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13014.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:28.827', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('e7d3c96e-22a8-4211-a518-05b60eee67d3', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 13.50, 10761.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 17217.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:30.652', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('e8378fcc-b156-40fa-8b37-ee6ca8db7f5a', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.00, 13543.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 21668.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:32.012', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('e8a649db-7d77-45d1-8f4b-60021cc05f4b', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 14.00, 11355.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11355.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('e8d0cb74-79b3-4bb5-920c-7489882d7ac6', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 12.50, 9969.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15950.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:35.319', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('eb5d7ee2-2857-485b-8dd8-17b7846d32bd', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 17.00, 13543.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13543.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('ecfde99c-338b-42f7-aa29-1a19da22f6b2', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.00, 4702.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4702.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('ed1c06c9-a2f3-4e8d-ac6e-32d377009d3d', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 4.00, 4399.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 4399.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('ed9f2731-1e01-428c-bf61-484655c6960f', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 8.00, 6904.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 11046.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:28.458', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('edd9a3ad-c45c-4257-80e3-bf8964a71109', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 11.00, 8786.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14057.60, NULL, 'true', NULL, '{}', '2026-09-01 08:23:29.797', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('eeaebb18-d78f-4eac-8e12-933b90c7b1ac', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 15.00, 11944.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 19110.40, NULL, 'true', NULL, '{}', '2026-09-01 08:23:31.14', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('efacb326-d513-4965-af07-509d6118c00c', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.50, 6068.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'US', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9708.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:27.856', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('efb5897b-26d4-4da0-8d5f-72e4f1c589f9', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 19.00, 15764.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15764.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('f0b40ce1-3dbf-4755-a5c7-add5551eee72', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 1.00, 2031.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 2031.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('f1797095-5d05-4eca-8df8-05c4548e9d8e', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.00, 5229.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5229.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('f473e36d-f712-4ad9-a84d-5c5e7e3af044', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 20.00, 15922.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 15922.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('f4e419f6-77d9-403e-8ac7-2928b4f6db05', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 70.00, 734.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1174.40, NULL, 'true', 'rate_type=per_kg', '{}', '2026-09-01 08:23:36.055', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('f52d2724-7c8b-440d-9cf4-84b44d8d1239', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 6.50, 6068.00, '2026-07-18 14:28:20.179504', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 6068.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('f629faf4-20d3-4d39-8cef-7b1f934ce1b2', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.50, 5953.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 5953.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('f8444b23-816a-4554-8f8f-cfeb0d1b73a4', '3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 0.50, 1498.00, '2026-07-18 14:28:20.179504', 'Document', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1498.00, NULL, 'true', NULL, '{}', '2026-07-18 14:28:20.179504', NULL),
	('fadc2ebc-4ef8-48e5-bbd1-8a0a5a440421', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 9.00, 7467.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7467.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('fc564fda-6a2e-42eb-a39e-3850337defb7', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 7.50, 7409.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'CA', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 7409.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL),
	('fcb4a986-291b-4b3c-8712-050aced8ff31', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.00, 5600.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 8960.00, NULL, 'true', NULL, '{}', '2026-09-01 08:23:27.375', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('fde1fc5f-681a-4ce4-8af0-2e86dea1e0c2', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 16.00, 13767.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 22027.20, NULL, 'true', NULL, '{}', '2026-09-01 08:23:31.646', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('fe95a7ab-b52e-44e8-af92-4ca1efe2248a', '6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 5.50, 5953.00, '2026-07-18 14:32:26.588777', 'Package', 'IN', 'CA', 0.00, 60.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 9524.80, NULL, 'true', NULL, '{}', '2026-09-01 08:23:34.709', '203ef505-318f-4d11-a2b6-931a5f022980'),
	('ffc79a64-3651-4a37-896a-24ff5e441fd0', '1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'air', NULL, NULL, NULL, NULL, 0.00, 18.00, 14341.00, '2026-07-18 14:19:11.573437', 'Package', 'IN', 'US', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 14341.00, NULL, 'true', NULL, '{}', '2026-07-18 14:19:11.573437', NULL);

-- Dumping structure for table public.tariff_versions
CREATE TABLE IF NOT EXISTS "tariff_versions" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"office_id" VARCHAR NOT NULL,
	"courier_partner_id" VARCHAR NULL DEFAULT NULL,
	"label" VARCHAR(255) NOT NULL,
	"file_name" VARCHAR(500) NULL DEFAULT NULL,
	"file_url" VARCHAR(500) NULL DEFAULT NULL,
	"valid_from" TIMESTAMP NOT NULL,
	"valid_to" TIMESTAMP NULL DEFAULT NULL,
	"status" VARCHAR(20) NOT NULL DEFAULT 'draft',
	"row_count" INTEGER NULL DEFAULT 0,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	"uploaded_by" VARCHAR NULL DEFAULT NULL,
	"column_config" JSONB NULL DEFAULT '{}',
	PRIMARY KEY ("id"),
	CONSTRAINT "tariff_versions_courier_partner_id_courier_partners_id_fk" FOREIGN KEY ("courier_partner_id") REFERENCES "courier_partners" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT "tariff_versions_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
	CONSTRAINT "tariff_versions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
)
CREATE INDEX "idx_tariff_versions_office" ON "" ("office_id");
CREATE INDEX "idx_tariff_versions_partner" ON "" ("courier_partner_id");
CREATE INDEX "idx_tariff_versions_status" ON "" ("status");;

-- Dumping data for table public.tariff_versions: -1 rows
INSERT INTO "tariff_versions" ("id", "office_id", "courier_partner_id", "label", "file_name", "file_url", "valid_from", "valid_to", "status", "row_count", "created_at", "updated_at", "uploaded_by", "column_config") VALUES
	('1bf9013c-6eb5-4af8-bfe4-c6414ea7c604', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'UPS July 2026', 'UPS_Express_Saver_Rates_12-07-2026_to_18-07-2026.xlsx', '/objects/1784384350458-768164953.xlsx', '2026-07-18 00:00:00', '2026-08-02 00:00:00', 'expired', 90, '2026-07-18 14:19:11.290491', '2026-07-18 14:28:19.847', NULL, '{}'),
	('3dcde7ab-1d61-4332-a32b-2ef0400ad2b3', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'UPS July 2026', 'UPS_Express_Saver_Rates_12-07-2026_to_18-07-2026.xlsx', '/objects/1784384899177-2716872.xlsx', '2026-07-18 00:00:00', '2026-08-02 00:00:00', 'expired', 90, '2026-07-18 14:28:19.90271', '2026-07-18 14:32:27.314', NULL, '{}'),
	('6ad84151-b645-4e83-9f7c-0d4612d5fc8b', '35329240-859e-4d67-a256-53eb2b96cd58', '405a9f63-e7c2-4b17-aa23-dbffa8e95666', 'UPS July 2026', 'UPS_Express_Saver_Rates_12-07-2026_to_18-07-2026.xlsx', '/objects/1784385145055-147830949.xlsx', '2026-07-18 00:00:00', '2026-08-02 00:00:00', 'active', 90, '2026-07-18 14:32:25.816579', '2026-09-01 08:23:36.54', NULL, '{}'),
	('ced1a560-2363-4b14-96eb-d2d3a85772a0', '35329240-859e-4d67-a256-53eb2b96cd58', NULL, 'UPS July 2026', 'UPS_Express_Saver_Rates_12-07-2026_to_18-07-2026.xlsx', '/objects/1784229067079-586233420.xlsx', '2026-07-16 00:00:00', '2026-07-31 00:00:00', 'expired', 0, '2026-07-16 19:11:08.14225', '2026-07-18 14:19:11.254', NULL, '{}');

-- Dumping structure for table public.users
CREATE TABLE IF NOT EXISTS "users" (
	"id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
	"email" VARCHAR NULL DEFAULT NULL,
	"first_name" VARCHAR NULL DEFAULT NULL,
	"last_name" VARCHAR NULL DEFAULT NULL,
	"profile_image_url" VARCHAR NULL DEFAULT NULL,
	"created_at" TIMESTAMP NULL DEFAULT now(),
	"updated_at" TIMESTAMP NULL DEFAULT now(),
	PRIMARY KEY ("id"),
	UNIQUE ("email")
);

-- Dumping data for table public.users: -1 rows
INSERT INTO "users" ("id", "email", "first_name", "last_name", "profile_image_url", "created_at", "updated_at") VALUES
	('41820828', 'user@example.com', 'Real', 'User', NULL, '2026-02-05 01:47:50.021', '2026-02-15 19:12:51.77'),
	('isolation-user-a-5DPLqH', 'usera@example.com', 'Alice', 'Anderson', NULL, '2026-02-15 07:18:46.66', '2026-02-15 07:18:46.66'),
	('isolation-user-b-uj9nlM', 'userb@example.com', 'Bob', 'Baker', NULL, '2026-02-15 07:19:17.748', '2026-02-15 07:19:17.748'),
	('slug-test-provider-001', 'slugtest@test.com', 'Slug', 'Test', NULL, '2026-02-13 07:16:13.319', '2026-02-13 07:16:13.319'),
	('test-quotation-user', 'quotation-test@example.com', 'Quotation', 'Tester', NULL, '2026-02-05 02:19:00.769', '2026-02-05 02:19:00.769'),
	('test-voice-user', 'voicetest@example.com', 'Voice', 'Tester', NULL, '2026-02-13 11:32:05.897', '2026-02-13 11:32:05.897'),
	('user-a-isolation-test', 'usera@test.com', 'User', 'A', NULL, '2026-02-13 05:38:44.479', '2026-02-13 05:38:44.479'),
	('user-b-isolation-test', 'userb@test.com', 'User', 'B', NULL, '2026-02-13 05:39:49.413', '2026-02-13 05:39:49.413');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
