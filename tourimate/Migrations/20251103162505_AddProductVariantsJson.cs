using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddProductVariantsJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<string>(
                name: "VariantsJson",
                table: "Products",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropColumn(
                name: "VariantsJson",
                table: "Products");

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
        }
    }
}
