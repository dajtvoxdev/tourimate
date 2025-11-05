using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class ChangeImagesProductToMax : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("38bbc7a4-9e77-4ea1-a13d-1a3d417103fc"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("3a392082-1462-4b6b-a536-00addb0cf45e"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("8d095dcf-8734-4f5c-9d47-700678fae191"));

            migrationBuilder.AlterColumn<string>(
                name: "Images",
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
                name: "Images",
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
                values: new object[] { new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8396), new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8397) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8413), new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8413) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8416), new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8417) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("38bbc7a4-9e77-4ea1-a13d-1a3d417103fc"), "Finance", new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8695), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8695), "0.15" },
                    { new Guid("3a392082-1462-4b6b-a536-00addb0cf45e"), "Security", new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8698), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8698), "5" },
                    { new Guid("8d095dcf-8734-4f5c-9d47-700678fae191"), "Finance", new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8690), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 4, 3, 12, 6, 709, DateTimeKind.Utc).AddTicks(8691), "0.15" }
                });
        }
    }
}
