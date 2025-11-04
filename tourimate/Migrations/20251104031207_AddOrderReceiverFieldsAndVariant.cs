using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderReceiverFieldsAndVariant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AddColumn<string>(
                name: "ReceiverEmail",
                table: "Orders",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReceiverName",
                table: "Orders",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReceiverPhone",
                table: "Orders",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SelectedVariant",
                table: "OrderItems",
                type: "nvarchar(500)",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropColumn(
                name: "ReceiverEmail",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ReceiverName",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ReceiverPhone",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SelectedVariant",
                table: "OrderItems");

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
    }
}
