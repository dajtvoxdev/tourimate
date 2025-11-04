using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class RemoveProductApprovalStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Users_ApprovedBy",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_Price_Status",
                table: "Products");

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

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CareInstructions",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Dimensions",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Features",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsDigital",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReturnPolicy",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SEODescription",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SEOKeywords",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ShippingInfo",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Specifications",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "UsageInstructions",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Warranty",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_ApprovedBy",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ApprovedBy",
                table: "Products");

            // Ensure a nullable UserId column exists to avoid runtime SQL errors
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Products",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Currency",
                table: "Products",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(3)",
                oldMaxLength: 3);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AlterColumn<string>(
                name: "Currency",
                table: "Products",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedBy",
                table: "Products",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_ApprovedBy",
                table: "Products",
                column: "ApprovedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_ApprovedBy",
                table: "Products",
                column: "ApprovedBy",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddColumn<int>(
                name: "ApprovalStatus",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "Products",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CareInstructions",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Dimensions",
                table: "Products",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Features",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDigital",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnPolicy",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SEODescription",
                table: "Products",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SEOKeywords",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShippingInfo",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Specifications",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "Products",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsageInstructions",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Warranty",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                table: "Products",
                type: "decimal(18,2)",
                nullable: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_Products_Price_Status",
                table: "Products",
                columns: new[] { "Price", "Status" });
        }
    }
}
