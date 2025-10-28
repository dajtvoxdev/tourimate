using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddBankFieldsToUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("37b365ce-3b32-4b19-9144-31ab46f8d893"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("74e8a44b-d841-4b46-9c45-ab241acd08a5"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e9b63921-b5c3-4ddb-a64a-12c79811adec"));

            migrationBuilder.AddColumn<string>(
                name: "BankAccount",
                table: "UserProfiles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountName",
                table: "UserProfiles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankCode",
                table: "UserProfiles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "UserProfiles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.DropColumn(
                name: "BankAccount",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "BankAccountName",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "BankCode",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "UserProfiles");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2207), new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2208) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2213), new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2214) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2217), new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2217) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("37b365ce-3b32-4b19-9144-31ab46f8d893"), "Security", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2456), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2457), "5" },
                    { new Guid("74e8a44b-d841-4b46-9c45-ab241acd08a5"), "Finance", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2439), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2439), "0.15" },
                    { new Guid("e9b63921-b5c3-4ddb-a64a-12c79811adec"), "Finance", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2453), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 28, 5, 41, 0, 685, DateTimeKind.Utc).AddTicks(2453), "0.15" }
                });
        }
    }
}
