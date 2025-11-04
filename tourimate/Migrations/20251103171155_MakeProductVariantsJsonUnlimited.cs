using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class MakeProductVariantsJsonUnlimited : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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
                name: "VariantsJson",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(4000)",
                oldMaxLength: 4000,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6697), new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6698) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6703), new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6703) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6706), new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6706) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("51664a6e-b7e0-4a68-8142-36c6e64833c2"), "Security", new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6929), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6930), "5" },
                    { new Guid("71f1b9e7-1b5d-4e0a-a437-a99dbb3db99a"), "Finance", new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6922), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6922), "0.15" },
                    { new Guid("fc4418e2-b15a-4d9d-abb2-9c676925eefb"), "Finance", new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6918), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 17, 11, 54, 815, DateTimeKind.Utc).AddTicks(6918), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("51664a6e-b7e0-4a68-8142-36c6e64833c2"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("71f1b9e7-1b5d-4e0a-a437-a99dbb3db99a"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("fc4418e2-b15a-4d9d-abb2-9c676925eefb"));

            migrationBuilder.AlterColumn<string>(
                name: "VariantsJson",
                table: "Products",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
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
    }
}
