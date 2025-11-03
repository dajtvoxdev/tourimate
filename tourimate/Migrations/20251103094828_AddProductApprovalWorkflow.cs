using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddProductApprovalWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Users_UserId",
                table: "Products");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("50d46564-a475-4d2a-8e83-ea0c1f1cf3ec"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("91c3b8b6-db27-4fdb-802e-1187f1393a52"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("98004e01-c59f-4867-b02e-b9aa80cede02"));

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Products",
                newName: "ApprovedBy");

            migrationBuilder.RenameIndex(
                name: "IX_Products_UserId",
                table: "Products",
                newName: "IX_Products_ApprovedBy");

            migrationBuilder.AddColumn<int>(
                name: "ApprovalStatus",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "Products",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(320), new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(325) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(345), new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(346) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(349), new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(349) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("37b2d737-4655-49f8-aae7-17cc7c21e314"), "Finance", new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(1001), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(1003), "0.15" },
                    { new Guid("6f357399-96d9-4414-8b75-654b4614451d"), "Security", new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(1087), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(1088), "5" },
                    { new Guid("b76252a8-0a59-40dc-97e6-bddcd5e0eed5"), "Finance", new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(1084), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 9, 48, 23, 226, DateTimeKind.Utc).AddTicks(1084), "0.15" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_ApprovedBy",
                table: "Products",
                column: "ApprovedBy",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Users_ApprovedBy",
                table: "Products");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("37b2d737-4655-49f8-aae7-17cc7c21e314"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("6f357399-96d9-4414-8b75-654b4614451d"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("b76252a8-0a59-40dc-97e6-bddcd5e0eed5"));

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "ApprovedBy",
                table: "Products",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Products_ApprovedBy",
                table: "Products",
                newName: "IX_Products_UserId");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9146), new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9149) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9155), new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9155) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9159), new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9159) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("50d46564-a475-4d2a-8e83-ea0c1f1cf3ec"), "Finance", new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9590), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9591), "0.15" },
                    { new Guid("91c3b8b6-db27-4fdb-802e-1187f1393a52"), "Finance", new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9594), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9595), "0.15" },
                    { new Guid("98004e01-c59f-4867-b02e-b9aa80cede02"), "Security", new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9598), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 28, 7, 55, 10, 49, DateTimeKind.Utc).AddTicks(9598), "5" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_UserId",
                table: "Products",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
