using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddProductsUserIdPlaceholder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("19d906d4-837d-453f-9407-43a3f102c7f3"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("bbd85090-df66-4b2b-a435-4e50afefdca8"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e4fedfa8-67dd-4d36-b54e-fefcf1cb1309"));

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Products",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(3980), new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(3982) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4021), new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4022) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4025), new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4025) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("abc291dc-e966-41d1-84d6-667803af34bb"), "Security", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4373), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4373), "5" },
                    { new Guid("af4e0b5c-e302-49df-8a65-c5e227412784"), "Finance", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4369), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4370), "0.15" },
                    { new Guid("b51d4859-fafc-4f33-a7d9-b755c41edbae"), "Finance", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4344), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 18, 18, 41, 613, DateTimeKind.Utc).AddTicks(4344), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("abc291dc-e966-41d1-84d6-667803af34bb"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("af4e0b5c-e302-49df-8a65-c5e227412784"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("b51d4859-fafc-4f33-a7d9-b755c41edbae"));

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2307), new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2307) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2312), new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2312) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2315), new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2316) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("19d906d4-837d-453f-9407-43a3f102c7f3"), "Finance", new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2516), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2517), "0.15" },
                    { new Guid("bbd85090-df66-4b2b-a435-4e50afefdca8"), "Finance", new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2496), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2497), "0.15" },
                    { new Guid("e4fedfa8-67dd-4d36-b54e-fefcf1cb1309"), "Security", new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2520), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 11, 3, 18, 11, 44, 918, DateTimeKind.Utc).AddTicks(2520), "5" }
                });
        }
    }
}
