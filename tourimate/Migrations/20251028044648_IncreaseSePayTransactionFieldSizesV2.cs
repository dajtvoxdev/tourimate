using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class IncreaseSePayTransactionFieldSizesV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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
                name: "ProcessingStatus",
                table: "SePayTransactions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "ProcessingNotes",
                table: "SePayTransactions",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "EntityType",
                table: "SePayTransactions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(4790), new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(4791) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(4796), new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(4796) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(4799), new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(4800) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("253e56c0-6b23-4ca4-be4c-0d6ef31de91f"), "Security", new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(5074), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(5074), "5" },
                    { new Guid("d1036436-4eb6-4e8f-ba15-c9509b90a015"), "Finance", new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(5066), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(5067), "0.15" },
                    { new Guid("ff5bc239-0b6b-4ab2-bead-57e2160c792a"), "Finance", new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(5070), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 28, 4, 46, 46, 976, DateTimeKind.Utc).AddTicks(5071), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("253e56c0-6b23-4ca4-be4c-0d6ef31de91f"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("d1036436-4eb6-4e8f-ba15-c9509b90a015"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("ff5bc239-0b6b-4ab2-bead-57e2160c792a"));

            migrationBuilder.AlterColumn<string>(
                name: "ProcessingStatus",
                table: "SePayTransactions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "ProcessingNotes",
                table: "SePayTransactions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "EntityType",
                table: "SePayTransactions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

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
    }
}
