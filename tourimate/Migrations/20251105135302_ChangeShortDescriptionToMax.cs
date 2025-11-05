using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class ChangeShortDescriptionToMax : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("098c3263-ce54-4cb8-8692-c465ad211741"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("22112331-34cf-4574-b765-8edb96519dc1"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("5c823fae-3585-45f9-8f15-65a28fc15b09"));

            migrationBuilder.AlterColumn<string>(
                name: "ShortDescription",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 5, 13, 53, 2, 18, DateTimeKind.Utc).AddTicks(9826), new DateTime(2025, 11, 5, 13, 53, 2, 18, DateTimeKind.Utc).AddTicks(9826) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 5, 13, 53, 2, 18, DateTimeKind.Utc).AddTicks(9832), new DateTime(2025, 11, 5, 13, 53, 2, 18, DateTimeKind.Utc).AddTicks(9833) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 5, 13, 53, 2, 18, DateTimeKind.Utc).AddTicks(9837), new DateTime(2025, 11, 5, 13, 53, 2, 18, DateTimeKind.Utc).AddTicks(9838) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("1746275d-9081-4c67-81e7-cfb9304ab5b1"), "Finance", new DateTime(2025, 11, 5, 13, 53, 2, 19, DateTimeKind.Utc).AddTicks(82), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 5, 13, 53, 2, 19, DateTimeKind.Utc).AddTicks(82), "0.15" },
                    { new Guid("3f0d2f9d-b9f8-4bbb-ac64-258f536efa0a"), "Finance", new DateTime(2025, 11, 5, 13, 53, 2, 19, DateTimeKind.Utc).AddTicks(87), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 5, 13, 53, 2, 19, DateTimeKind.Utc).AddTicks(88), "0.15" },
                    { new Guid("e3e801e9-68ae-4611-b4fe-719993981c94"), "Security", new DateTime(2025, 11, 5, 13, 53, 2, 19, DateTimeKind.Utc).AddTicks(92), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 5, 13, 53, 2, 19, DateTimeKind.Utc).AddTicks(92), "5" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("1746275d-9081-4c67-81e7-cfb9304ab5b1"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("3f0d2f9d-b9f8-4bbb-ac64-258f536efa0a"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e3e801e9-68ae-4611-b4fe-719993981c94"));

            migrationBuilder.AlterColumn<string>(
                name: "ShortDescription",
                table: "Products",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(2935), new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(2936) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(2943), new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(2943) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(2998), new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(2999) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("098c3263-ce54-4cb8-8692-c465ad211741"), "Finance", new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(3286), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(3286), "0.15" },
                    { new Guid("22112331-34cf-4574-b765-8edb96519dc1"), "Finance", new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(3281), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(3281), "0.15" },
                    { new Guid("5c823fae-3585-45f9-8f15-65a28fc15b09"), "Security", new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(3290), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 5, 13, 40, 26, 536, DateTimeKind.Utc).AddTicks(3290), "5" }
                });
        }
    }
}
