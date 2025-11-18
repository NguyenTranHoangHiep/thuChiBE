CREATE DATABASE  IF NOT EXISTS `thuchi` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `thuchi`;
-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: thuchi
-- ------------------------------------------------------
-- Server version	8.0.34

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `danhmuc`
--

DROP TABLE IF EXISTS `danhmuc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danhmuc` (
  `maDanhMuc` int NOT NULL AUTO_INCREMENT,
  `tenDanhMuc` varchar(50) NOT NULL,
  `loai` enum('thu','chi') NOT NULL,
  PRIMARY KEY (`maDanhMuc`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danhmuc`
--

LOCK TABLES `danhmuc` WRITE;
/*!40000 ALTER TABLE `danhmuc` DISABLE KEYS */;
INSERT INTO `danhmuc` VALUES (1,'Lương','thu'),(2,'Giải thưởng','thu'),(3,'Bán thời gian','thu'),(4,'Khoản đầu tư','thu'),(5,'Mua sắm','chi'),(6,'Đồ ăn','chi'),(7,'Giải  trí','chi'),(8,'Sức khỏe','chi'),(9,'Giáo dục','chi'),(10,'Khác','chi'),(11,'Khác','thu');
/*!40000 ALTER TABLE `danhmuc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giaodich`
--

DROP TABLE IF EXISTS `giaodich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giaodich` (
  `maGiaoDich` int NOT NULL AUTO_INCREMENT,
  `maNguoiDung` int DEFAULT NULL,
  `maDanhMuc` int DEFAULT NULL,
  `soTien` decimal(15,2) NOT NULL,
  `ghiChu` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `ngayGiaoDich` date NOT NULL,
  `ngayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`maGiaoDich`),
  KEY `maNguoiDung` (`maNguoiDung`),
  KEY `maDanhMuc` (`maDanhMuc`),
  CONSTRAINT `giaodich_ibfk_1` FOREIGN KEY (`maNguoiDung`) REFERENCES `users` (`maNguoiDung`),
  CONSTRAINT `giaodich_ibfk_2` FOREIGN KEY (`maDanhMuc`) REFERENCES `danhmuc` (`maDanhMuc`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giaodich`
--

LOCK TABLES `giaodich` WRITE;
/*!40000 ALTER TABLE `giaodich` DISABLE KEYS */;
INSERT INTO `giaodich` VALUES (2,3,2,30000.00,NULL,'2025-05-22','2025-05-25 15:34:43'),(3,3,1,2000000.00,'Lương  tháng 5','2025-06-29','2025-05-25 16:24:29'),(4,3,7,25000000.00,'Đi Disneyland','2025-05-23','2025-05-25 16:39:41'),(6,3,10,6000000.00,'Bán 1 chỉ vàng','2025-05-14','2025-05-25 19:31:26'),(7,3,9,2000000.00,'Học làm nail','2025-05-22','2025-05-25 21:18:13'),(8,3,2,2000000.00,'Thi tin học','2025-05-15','2025-05-27 20:19:45'),(9,3,4,2000000.00,'Đầu tư tiền ảo','2025-05-14','2025-05-27 20:35:05'),(10,3,10,5000000.00,'Bán pc','2025-05-15','2025-05-27 20:35:25'),(11,3,3,300000.00,'Bán cafe','2025-05-16','2025-05-27 20:35:44'),(12,3,3,3000000.00,'Bán khóa học','2025-05-17','2025-05-27 20:36:21'),(13,3,6,4500000.00,'Ăn tôm hùm','2025-05-07','2025-05-27 20:38:17'),(14,2,1,2000000.00,'Lương  tháng 5','2025-05-09','2025-05-29 17:56:52'),(15,3,1,2000000.00,'Lương tháng 4','2024-05-15','2025-05-29 21:16:25'),(16,3,5,200000.00,'Mua kẹo','2025-01-22','2025-05-29 22:39:17'),(17,3,1,5000000.00,'Lương  tháng 4','2025-04-04','2025-05-31 17:32:29'),(18,2,1,2000000.00,'Lương  tháng 4','2024-04-17','2025-06-02 12:35:20');
/*!40000 ALTER TABLE `giaodich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ngansach`
--

DROP TABLE IF EXISTS `ngansach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ngansach` (
  `maNganSach` int NOT NULL AUTO_INCREMENT,
  `maNguoiDung` int DEFAULT NULL,
  `maDanhMuc` int DEFAULT NULL,
  `gioiHanTien` decimal(15,2) NOT NULL,
  `ngayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  `thang` int DEFAULT NULL,
  `nam` int NOT NULL DEFAULT '2025',
  PRIMARY KEY (`maNganSach`),
  KEY `maNguoiDung` (`maNguoiDung`),
  KEY `maDanhMuc` (`maDanhMuc`),
  CONSTRAINT `ngansach_ibfk_1` FOREIGN KEY (`maNguoiDung`) REFERENCES `users` (`maNguoiDung`),
  CONSTRAINT `ngansach_ibfk_2` FOREIGN KEY (`maDanhMuc`) REFERENCES `danhmuc` (`maDanhMuc`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ngansach`
--

LOCK TABLES `ngansach` WRITE;
/*!40000 ALTER TABLE `ngansach` DISABLE KEYS */;
INSERT INTO `ngansach` VALUES (1,3,1,2000000.00,'2025-05-30 22:01:18',5,2024),(2,3,3,25000000.00,'2025-05-31 08:42:57',5,2025),(4,3,5,200000.00,'2025-05-31 08:44:13',1,2025),(5,3,6,3000000.00,'2025-05-31 08:44:13',5,2025),(7,3,1,25000000.00,'2025-05-31 17:34:40',NULL,2025),(8,3,2,200000.00,'2025-05-31 18:31:01',2,2025),(9,3,1,20000.00,'2025-06-01 09:31:52',3,2025),(10,3,3,22000.00,'2025-06-01 09:39:25',3,2025),(11,3,3,2000000.00,'2025-06-02 13:54:33',1,2024);
/*!40000 ALTER TABLE `ngansach` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `maNguoiDung` int NOT NULL AUTO_INCREMENT,
  `tenDangNhap` varchar(50) NOT NULL,
  `matKhau` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` int NOT NULL,
  `ngayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`maNguoiDung`),
  UNIQUE KEY `tenDangNhap` (`tenDangNhap`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'matuga1234','$2b$10$WchkRz01VrIJ9uTVSzvVJ.QHDJYihBQilGkC3DyR5yOG6useRoeJa','hiepvn4@gmail.com',0,'2025-05-22 13:55:54'),(2,'matuga1235','$2b$10$T5AcuwJtq7waOlCV1X0Z5uFe9vx3.xrX9x0IThM6sQzYpQXp/uUsC','huy@gmail.com',1,'2025-05-24 17:10:54'),(3,'matuga123','$2b$10$bLzvZptZbHTgL5zEgksQ..FC26BID54qwVqZvIqAOElj/Q7xvXW0u','hiep99@gmail.com',1,'2025-05-24 17:31:28');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-03 23:26:32
