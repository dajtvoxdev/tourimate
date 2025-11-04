using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddSelectedVariantToShoppingCart : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("103d0d7d-cc1d-4fd1-a23d-5828d39015ab"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("44b65c34-7aaa-4b68-b4eb-934922a25e08"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("9816eb35-c10e-4ea5-9143-a8e2aa618242"));

            migrationBuilder.AddColumn<string>(
                name: "SelectedVariant",
                table: "ShoppingCart",
                type: "nvarchar(500)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8193), new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8194) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8199), new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8199) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8202), new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8203) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("8b4333a4-45db-46d4-b709-98ac6f1885e4"), "Security", new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8485), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8486), "5" },
                    { new Guid("c4136248-06e2-4b96-8dc0-bb09b9e4ad59"), "Finance", new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8477), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8478), "0.15" },
                    { new Guid("ea8ee003-dc6a-4a4b-a496-bb2a20c71a8e"), "Finance", new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8482), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 4, 2, 35, 48, 684, DateTimeKind.Utc).AddTicks(8482), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("8b4333a4-45db-46d4-b709-98ac6f1885e4"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("c4136248-06e2-4b96-8dc0-bb09b9e4ad59"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("ea8ee003-dc6a-4a4b-a496-bb2a20c71a8e"));

            migrationBuilder.DropColumn(
                name: "SelectedVariant",
                table: "ShoppingCart");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3570), new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3572) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3581), new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3581) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3585), new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3586) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("103d0d7d-cc1d-4fd1-a23d-5828d39015ab"), "Finance", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3914), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3915), "0.15" },
                    { new Guid("44b65c34-7aaa-4b68-b4eb-934922a25e08"), "Security", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3928), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3929), "5" },
                    { new Guid("9816eb35-c10e-4ea5-9143-a8e2aa618242"), "Finance", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3919), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 18, 35, 29, 624, DateTimeKind.Utc).AddTicks(3919), "0.15" }
                });
        }
    }
}
