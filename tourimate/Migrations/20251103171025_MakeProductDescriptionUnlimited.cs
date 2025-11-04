using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class MakeProductDescriptionUnlimited : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("32543215-399a-41a5-82a2-ed7a349aa50c"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("46926061-ac27-489a-853a-105db7cfbb65"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("d0724453-3a80-419c-a817-f88c645811d0"));

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4029), new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4032) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4038), new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4039) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4042), new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4042) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("248a9c4c-236f-4604-bc70-f0e77ef97e96"), "Finance", new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4275), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4275), "0.15" },
                    { new Guid("47cc7d92-3069-40b8-a9bb-5e7d04713c7f"), "Finance", new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4268), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4268), "0.15" },
                    { new Guid("734e77f4-e395-46a9-856d-dc813ab93c0b"), "Security", new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4289), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 17, 10, 24, 604, DateTimeKind.Utc).AddTicks(4289), "5" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("248a9c4c-236f-4604-bc70-f0e77ef97e96"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("47cc7d92-3069-40b8-a9bb-5e7d04713c7f"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("734e77f4-e395-46a9-856d-dc813ab93c0b"));

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8056), new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8057) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8061), new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8061) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8064), new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8064) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("32543215-399a-41a5-82a2-ed7a349aa50c"), "Finance", new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8376), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8377), "0.15" },
                    { new Guid("46926061-ac27-489a-853a-105db7cfbb65"), "Finance", new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8360), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8361), "0.15" },
                    { new Guid("d0724453-3a80-419c-a817-f88c645811d0"), "Security", new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8380), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 16, 25, 3, 515, DateTimeKind.Utc).AddTicks(8380), "5" }
                });
        }
    }
}
