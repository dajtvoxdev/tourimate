using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class IncreaseSePayTransactionFieldSizes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("1044fbf7-2b72-41c0-9e40-ad2ced8d1921"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("1ce2aa24-1fca-4558-9902-e33771acde13"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("87547ae4-fbc0-4eca-8994-15cfc33c57aa"));

            migrationBuilder.AlterColumn<string>(
                name: "SubAccount",
                table: "SePayTransactions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ReferenceCode",
                table: "SePayTransactions",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "SePayTransactions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AccountNumber",
                table: "SePayTransactions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1529), new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1529) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1534), new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1534) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1539), new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1539) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("42636af1-5399-4d95-b4e0-41028d96712e"), "Finance", new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1842), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1842), "0.15" },
                    { new Guid("4a0210dc-2d30-4939-aa29-794c72d1a5de"), "Security", new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1849), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1850), "5" },
                    { new Guid("67ce9190-42d9-4eca-bc99-c26b1e39b5e3"), "Finance", new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1846), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 28, 4, 41, 14, 522, DateTimeKind.Utc).AddTicks(1846), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("42636af1-5399-4d95-b4e0-41028d96712e"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("4a0210dc-2d30-4939-aa29-794c72d1a5de"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("67ce9190-42d9-4eca-bc99-c26b1e39b5e3"));

            migrationBuilder.AlterColumn<string>(
                name: "SubAccount",
                table: "SePayTransactions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ReferenceCode",
                table: "SePayTransactions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "SePayTransactions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AccountNumber",
                table: "SePayTransactions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5347), new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5348) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5353), new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5353) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5356), new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5357) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("1044fbf7-2b72-41c0-9e40-ad2ced8d1921"), "Finance", new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5637), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5637), "0.15" },
                    { new Guid("1ce2aa24-1fca-4558-9902-e33771acde13"), "Finance", new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5653), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5654), "0.15" },
                    { new Guid("87547ae4-fbc0-4eca-8994-15cfc33c57aa"), "Security", new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5657), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 28, 4, 6, 55, 178, DateTimeKind.Utc).AddTicks(5657), "5" }
                });
        }
    }
}
